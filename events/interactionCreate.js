const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const configFunctions = require('../utils/configFunctions');
const { showMainConfigMenu } = require('../commands/admin/config');
const pool = require('../config/database');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
          await command.execute(interaction, client);
        } catch (error) {
          console.error(error);
          await logger.logError(`Comando ${interaction.commandName}`, error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
          } else {
            await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
          }
        }
        return;
      }

      if (interaction.isAnySelectMenu()) {
        await handleSelectMenu(interaction, client);
        return;
      }

      if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction, client);
        return;
      }

      if (interaction.isButton()) {
        await handleButton(interaction, client);
        return;
      }
    } catch (error) {
      console.error('Erro ao processar interação:', error);
      await logger.logError('InteractionCreate', error);
    }
  },
};

// ================================================
//                HANDLERS DE BOTÕES
// ================================================
async function handleButton(interaction, client) {
    const customId = interaction.customId;

    if (customId.startsWith('interview_')) {
        await interaction.deferUpdate(); // Responde imediatamente para evitar o erro "interação falhou"

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.followUp({ content: '❌ Você não tem permissão.', ephemeral: true });
        }
        const [_, action, userId] = customId.split('_');
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) {
            return interaction.followUp({ content: '❌ Utilizador não encontrado.', ephemeral: true });
        }

        const resultChannel = await client.channels.fetch(client.config.CHANNELS.WL_RESULT_CHANNEL_ID);
        const releaseRole = interaction.guild.roles.cache.get(client.config.ROLES.AWAITING_ID_RELEASE_ROLE);
        const waitingRole = interaction.guild.roles.cache.get(client.config.ROLES.AWAITING_INTERVIEW_ROLE);
        
        if (waitingRole) await member.roles.remove(waitingRole);

        if (action === 'approve') {
            if (releaseRole) await member.roles.add(releaseRole);
            await resultChannel.send(`🧑‍⚖️ <@${userId}> foi **APROVADO** na entrevista pela staff e agora pode liberar seu ID!`);
        } else {
            await resultChannel.send(`❌ <@${userId}>, infelizmente você foi **REPROVADO** na entrevista.`);
        }
        
        await interaction.message.delete(); 
        return;
    }

    if (customId.startsWith('config_')) {
        if (interaction.guild.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ Apenas o dono do servidor.', ephemeral: true });
        const configType = customId.split('_')[1];
        if (configType === 'back') return showMainConfigMenu(interaction, client);
        if (configType === 'save') return configFunctions.saveConfig(interaction, client);
        const handlerName = `show${configType.charAt(0).toUpperCase() + configType.slice(1)}Config`;
        if (configFunctions[handlerName]) await configFunctions[handlerName](interaction, client);
        return;
    }
    
    if (customId.startsWith('autorole_type_')) {
        if (interaction.guild.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ Apenas o dono do servidor.', ephemeral: true });
        client.tempConfig = client.tempConfig || JSON.parse(JSON.stringify(client.config));
        if (!client.tempConfig.roleSystem) client.tempConfig.roleSystem = {};
        const type = customId.split('_')[2];
        client.tempConfig.roleSystem.type = type;
        await interaction.update({ content: `✅ Modo de autorole alterado para: ${type}. Lembre-se de salvar.`, components: interaction.message.components });
        return;
    }

    if (customId.startsWith('suggestion_')) {
        const suggestionCommand = client.commands.get('sugestao');
        if (suggestionCommand && suggestionCommand.handleInteraction) await suggestionCommand.handleInteraction(interaction, client);
        return;
    }

    if (customId.startsWith('ticket_')) {
        const ticketType = customId.split('_')[1];
        const categoryId = client.config.TICKET_CATEGORIES ? client.config.TICKET_CATEGORIES[ticketType] : null;
        const roleId = client.config.ROLES.TICKET_ROLES ? client.config.ROLES.TICKET_ROLES[ticketType] : null;

        if (!categoryId || !roleId) {
            return interaction.reply({ content: `A configuração de tickets (categoria ou cargo) para "${ticketType}" não foi encontrada.`, ephemeral: true });
        }
        
        const allTicketCategoryIds = Object.values(client.config.TICKET_CATEGORIES);
        const existingTicket = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id && allTicketCategoryIds.includes(c.parentId));
        if (existingTicket) {
            return interaction.reply({ content: `Você já possui um ticket aberto: <#${existingTicket.id}>`, ephemeral: true });
        }

        let categoryName = ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
        let ticketName = `${ticketType}-${interaction.user.username}`;
        
        try {
            const ticketCategory = interaction.guild.channels.cache.get(categoryId);
            if (!ticketCategory) return interaction.reply({ content: `A categoria de ticket com ID ${categoryId} não foi encontrada.`, ephemeral: true });

            const ticketChannel = await interaction.guild.channels.create({ name: ticketName, type: ChannelType.GuildText, parent: ticketCategory.id, topic: interaction.user.id, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }, { id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }]});
            const embed = new EmbedBuilder().setColor(0x0099FF).setTitle(`Ticket de ${categoryName}`).setDescription(`Olá <@${interaction.user.id}>, bem-vindo(a). A equipe responsável irá atendê-lo em breve.`);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger));
            await ticketChannel.send({ content: `<@${interaction.user.id}> <@&${roleId}>`, embeds: [embed], components: [row] });
            await interaction.reply({ content: `Seu ticket foi criado: <#${ticketChannel.id}>`, ephemeral: true });
        } catch (error) { 
            logger.logError("Criação de Ticket", error);
            await interaction.reply({ content: 'Ocorreu um erro ao criar seu ticket.', ephemeral: true });
        }
        return;
    }

    if (customId === 'close_ticket' || customId === 'confirm_close' || customId === 'cancel_close') {
        if (customId === 'close_ticket') {
            const embed = new EmbedBuilder().setColor(0xFF0000).setTitle('Fechar Ticket').setDescription('Tem certeza que deseja fechar este ticket?');
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('confirm_close').setLabel('Confirmar').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId('cancel_close').setLabel('Cancelar').setStyle(ButtonStyle.Secondary));
            await interaction.reply({ embeds: [embed], components: [row] });
        } else if (customId === 'confirm_close') {
            await interaction.update({ content: 'O ticket será fechado em 5 segundos...', embeds: [], components: [] });
            setTimeout(() => interaction.channel.delete('Ticket fechado.').catch(err => console.error(`[TICKET-CLEANUP] Falha ao apagar canal de ticket:`, err)), 5000);
        } else if (customId === 'cancel_close') {
            await interaction.message.delete();
        }
        return;
    }
    
    if (customId === 'start_interview_button') {
        const userId = interaction.user.id;
        const interviewCategory = client.channels.cache.get(client.config.INTERVIEW_CATEGORY_ID);
        if (!interviewCategory) return interaction.reply({ content: '❌ Categoria de entrevistas não configurada.', ephemeral: true });
        await interaction.reply({ content: 'Iniciando sua entrevista... Um canal privado foi criado para você.', ephemeral: true });
        const channel = await interaction.guild.channels.create({ name: `entrevista-${interaction.user.username}`, type: ChannelType.GuildText, parent: interviewCategory, permissionOverwrites: [{ id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]});
        runQuestionnaire(channel, interaction.member, client);
        return;
    }
    if (customId === 'use_codigim_button') {
        const modal = new ModalBuilder().setCustomId('codigim_apply_modal').setTitle('Aplicar Código de Acesso');
        const codeInput = new TextInputBuilder().setCustomId('code_input').setLabel('Insira seu código').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
        await interaction.showModal(modal);
        return;
    }
    if (customId === 'release_id_button') {
        const modal = new ModalBuilder().setCustomId('release_id_modal').setTitle('Liberação de Acesso');
        const idInput = new TextInputBuilder().setCustomId('steam_input').setLabel('Seu Steam Hex ID (sem "steam:")').setStyle(TextInputStyle.Short).setRequired(true);
        const nameInput = new TextInputBuilder().setCustomId('name_input').setLabel('Nome e Sobrenome do Personagem').setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(idInput), new ActionRowBuilder().addComponents(nameInput));
        await interaction.showModal(modal);
        return;
    }
}

// ================================================
//             HANDLERS DE MODAIS
// ================================================
async function handleModalSubmit(interaction, client) {
    const customId = interaction.customId;

    if (customId.startsWith('story_modal_')) {
        await interaction.deferReply({ ephemeral: true });
        
        const [_, __, userId, score] = customId.split('_');
        const characterStory = interaction.fields.getTextInputValue('character_story_input');

        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!member) return interaction.editReply({ content: 'Não foi possível encontrar o membro.' });

        const approvalChannel = await client.channels.fetch(client.config.CHANNELS.STAFF_APPROVAL_CHANNEL_ID);
        const waitingRole = interaction.guild.roles.cache.get(client.config.ROLES.AWAITING_INTERVIEW_ROLE);
        const questions = require('../data/questions.json');

        if (waitingRole) await member.roles.add(waitingRole);

        const embed = new EmbedBuilder().setColor(0xFFA500).setTitle('Nova Análise de Entrevista').setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() }).setDescription(characterStory).addFields({ name: '👤 Utilizador', value: member.toString(), inline: true },{ name: '📊 Pontuação', value: `**${score}/${questions.length}** Acertos`, inline: true },{ name: '📖 História do Personagem', value: 'A história do personagem está no campo de descrição acima.' }).setTimestamp();
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`interview_approve_${member.id}`).setLabel('Aprovar').setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId(`interview_reject_${member.id}`).setLabel('Reprovar').setStyle(ButtonStyle.Danger));
        await approvalChannel.send({ content: `Nova análise para <@&${client.config.ROLES.STAFF}>`, embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ História recebida! Sua solicitação foi enviada para a staff. Este canal será fechado em 20 segundos.' });
        
        setTimeout(() => {
            interaction.channel.delete('Processo de entrevista concluído.')
                .catch(err => console.error(`[WL-CLEANUP] Falha ao auto-apagar o canal ${interaction.channel.name}:`, err));
        }, 20000);
        return;
    }

    if (customId.startsWith('modal_config_')) {
        if (interaction.guild.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ Apenas o dono do servidor.', ephemeral: true });
        const map = { 'bot': 'handleBotConfigModal', 'database': 'handleDatabaseConfigModal', 'fivem': 'handleFivemConfigModal', 'webhook': 'handleWebhookConfigModal', 'social': 'handleSocialConfigModal' };
        const handler = configFunctions[map[customId.substring(13)]];
        if (handler) await handler(interaction, client);
        return;
    }
    if (customId === 'codigim_apply_modal') {
        await interaction.deferReply({ ephemeral: true });
        const code = interaction.fields.getTextInputValue('code_input');
        const [rows] = await pool.execute('SELECT * FROM codigim_codes WHERE code = ?', [code]);
        if (rows.length === 0 || rows[0].is_used) return interaction.editReply({ content: '❌ Código inválido ou já utilizado.' });
        await pool.execute('UPDATE codigim_codes SET is_used = true, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE code = ?', [interaction.user.id, code]);
        const member = interaction.member;
        const releaseRole = interaction.guild.roles.cache.get(client.config.ROLES.AWAITING_ID_RELEASE_ROLE);
        if (releaseRole) await member.roles.add(releaseRole);
        const resultChannel = await client.channels.fetch(client.config.CHANNELS.WL_RESULT_CHANNEL_ID);
        await resultChannel.send(`🎟️ <@${interaction.user.id}> utilizou um CÓDIGO VÁLIDO e avançou para a liberação de ID!`);
        return interaction.editReply({ content: `✅ Código validado! Você recebeu o cargo para ver o canal de liberação de ID.` });
    }
    if (customId === 'release_id_modal') {
        await interaction.deferReply({ ephemeral: true });
        const steam = interaction.fields.getTextInputValue('steam_input');
        const name = interaction.fields.getTextInputValue('name_input');
        const [rows] = await pool.execute('SELECT * FROM summerz_accounts WHERE steam = ?', [steam]);
        if (rows.length === 0) return interaction.editReply({ content: `❌ Steam ID \`${steam}\` não encontrado!` });
        if (rows[0].whitelist === 1) return interaction.editReply({ content: `❌ Este Steam ID já possui whitelist!` });
        await pool.execute('UPDATE summerz_accounts SET whitelist = 1, discord = ? WHERE steam = ?', [interaction.user.id, steam]);
        const member = interaction.member;
        const whitelistRole = interaction.guild.roles.cache.get(client.config.ROLES.WHITELIST);
        const releaseRole = interaction.guild.roles.cache.get(client.config.ROLES.AWAITING_ID_RELEASE_ROLE);
        const welcomeRole = interaction.guild.roles.cache.get(client.config.ROLES.WELCOME);
        if (whitelistRole) await member.roles.add(whitelistRole);
        if (releaseRole) await member.roles.remove(releaseRole);
        if (welcomeRole) await member.roles.remove(welcomeRole);
        const resultChannel = await client.channels.fetch(client.config.CHANNELS.WL_RESULT_CHANNEL_ID);
        await resultChannel.send(`✅ <@${interaction.user.id}> foi aprovado na allowlist! Seja bem-vindo(a)! 🎉`);
        return interaction.editReply({ content: `✅ Whitelist aprovada para o Steam ID ${steam}!` });
    }
}

// ================================================
//           HANDLER DE MENUS DE SELEÇÃO
// ================================================
async function handleSelectMenu(interaction, client) {
    if (interaction.guild.ownerId !== interaction.user.id) return interaction.reply({ content: '❌ Apenas o dono do servidor.', ephemeral: true });
    client.tempConfig = client.tempConfig || JSON.parse(JSON.stringify(client.config));
    
    const configPath = {
        select_welcome_channel: { path: client.tempConfig, key: 'WELCOME_CHANNEL_ID' },
        select_suggestion_channel: { path: client.tempConfig, key: 'SUGGESTION_CHANNEL_ID' },
        select_ticket_logs_channel: { path: client.tempConfig, key: 'TICKET_LOGS_CHANNEL_ID' },
        select_backup_channel: { path: client.tempConfig, key: 'BACKUP_CHANNEL_ID' },
        select_ticket_category: { path: client.tempConfig, key: 'TICKET_CATEGORY_ID' },
        select_verification_channel: { path: client.tempConfig.roleSystem, key: 'verificationChannel' },
    };

    const rolePath = {
        select_admin_role: 'ADMIN',
        select_staff_role: 'STAFF',
        select_welcome_role: 'WELCOME',
        select_whitelist_role: 'WHITELIST',
        select_remove_after_wl_role: 'REMOVE_AFTER_WL',
    };

    if (interaction.isChannelSelectMenu()) {
        const selection = configPath[interaction.customId];
        if (selection) {
            selection.path[selection.key] = interaction.values[0];
            await interaction.reply({ content: `✅ Canal definido. Lembre-se de salvar as configurações.`, ephemeral: true });
        }
    }
    if (interaction.isRoleSelectMenu()) {
        const roleKey = rolePath[interaction.customId];
        if (roleKey) {
            if (!client.tempConfig.ROLES) client.tempConfig.ROLES = {};
            client.tempConfig.ROLES[roleKey] = interaction.values[0];
            await interaction.reply({ content: `✅ Cargo definido. Lembre-se de salvar as configurações.`, ephemeral: true });
        }
    }
}

// ================================================
//           FUNÇÃO DO QUESTIONÁRIO
// ================================================
async function runQuestionnaire(channel, member, client) {
    const questionsPath = path.join(__dirname, '..', 'data', 'questions.json');
    const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    let score = 0;

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const embed = new EmbedBuilder().setTitle(`Pergunta ${i + 1}/${questions.length}: ${question.question}`).setDescription(question.options).setColor(0x3498DB).setFooter({ text: "Você tem 60 segundos." });
        const row = new ActionRowBuilder().addComponents(['1', '2', '3', '4'].map(num => new ButtonBuilder().setCustomId(`question_${i}_${num}`).setLabel(num).setStyle(ButtonStyle.Primary)));
        const msg = await channel.send({ embeds: [embed], components: [row] });
        try {
            const collected = await msg.awaitMessageComponent({ filter: (i) => i.user.id === member.id, componentType: ComponentType.Button, time: 60000 });
            const selectedOption = collected.customId.split('_')[2];
            if (selectedOption === question.correct) {
                score++;
                await collected.update({ content: '✅ Resposta correta!', embeds: [], components: [] });
            } else {
                await collected.update({ content: `❌ Resposta incorreta. A certa era a ${question.correct}.`, embeds: [], components: [] });
            }
        } catch (err) {
            await channel.send('❌ Tempo esgotado. Este canal será excluído em 10 segundos.');
            setTimeout(() => {
                channel.delete('Tempo esgotado na pergunta.')
                    .catch(e => console.error(`[WL-CLEANUP] Falha ao auto-apagar o canal ${channel.name}:`, e));
            }, 10000);
            return;
        }
    }
    
    if (score >= 6) {
        const embed = new EmbedBuilder().setColor(0x57F287).setTitle('✅ Questionário Concluído!').setDescription(`Você concluiu o questionário com ${score}/${questions.length} acertos!\n\nO próximo e último passo é **escrever a história do seu personagem**.\n\nClique no botão abaixo para abrir o formulário.`).setFooter({ text: 'Capriche na história, ela é fundamental para a sua aprovação!' });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`submit_story_button_${member.id}_${score}`).setLabel('Enviar História do Personagem').setStyle(ButtonStyle.Success).setEmoji('📝'));
        const storyMessage = await channel.send({ embeds: [embed], components: [row] });

        const collector = storyMessage.createMessageComponentCollector({
            filter: i => i.customId.startsWith('submit_story_button') && i.user.id === member.id,
            time: 600000, // 10 minutos
            max: 1 
        });

        collector.on('collect', async i => {
            const [_, __, ___, userId, scoreValue] = i.customId.split('_');
            const modal = new ModalBuilder()
                .setCustomId(`story_modal_${userId}_${scoreValue}`)
                .setTitle('História do Personagem');
            const storyInput = new TextInputBuilder()
                .setCustomId('character_story_input')
                .setLabel("Digite a história do seu personagem aqui")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true).setMinLength(100).setMaxLength(4000);
            modal.addComponents(new ActionRowBuilder().addComponents(storyInput));
            
            await i.showModal(modal);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                channel.send('❌ Tempo esgotado para enviar a história. Este canal será excluído.')
                    .then(() => {
                        setTimeout(() => {
                            channel.delete('Tempo esgotado para enviar história.')
                                .catch(e => console.error(`[WL-CLEANUP] Falha ao auto-apagar o canal ${channel.name}:`, e));
                        }, 10000);
                    });
            }
        });

    } else {
        await channel.send(`❌ Você não atingiu a pontuação mínima (acertou ${score}/${questions.length}). Este canal será apagado em 20 segundos.`);
        const resultChannel = await client.channels.fetch(client.config.CHANNELS.WL_RESULT_CHANNEL_ID);
        await resultChannel.send(`❌ <@${member.id}> foi reprovado no questionário automático.`);
        setTimeout(() => {
            channel.delete('Reprovado no questionário.')
                .catch(e => console.error(`[WL-CLEANUP] Falha ao auto-apagar o canal ${channel.name}:`, e));
        }, 20000);
    }
}