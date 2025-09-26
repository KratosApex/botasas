const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const InvitesTracker = require('@androz2091/discord-invites-tracker');
const pool = require('./config/database');

async function startBot() {
  // Carregar configuração
  const configPath = path.join(__dirname, 'config', 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('Erro ao ler arquivo de configuração:', error);
      config = {};
    }
  }

  // Inicializar o cliente do Discord
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  // Coleções para comandos e eventos
  client.commands = new Collection();
  client.events = new Collection();
  client.config = config; // Disponibilizar config para todo o bot
  client.tempConfig = null; // Configuração temporária para edição
  client.statusMessages = new Map(); // Armazenar mensagens de status para atualização

  // ================================================================= //
  // ============ INÍCIO DO CÓDIGO DO SISTEMA DE INDICAÇÃO ============ //
  // ================================================================= //
  
  const tracker = InvitesTracker.init(client, {
      fetchGuilds: true,
      fetchVanity: true,
      fetchAuditLogs: true
  });
  client.tracker = tracker;
  tracker.on('memberJoin', async (member, type, invite) => {
      // Logs de diagnóstico
      console.log('================================');
      console.log('[DEBUG INDICAÇÃO] Evento memberJoin disparado!');
      console.log(`[DEBUG INDICAÇÃO] Membro: ${member.user.tag} (${member.id})`);
      console.log(`[DEBUG INDICAÇÃO] Tipo de Entrada: ${type}`);
      console.log(`[DEBUG INDICAÇÃO] Convite Usado:`, invite);
      console.log('================================');

      if (type !== 'normal' || !invite.inviter) {
          console.log('[INDICAÇÃO] Processo interrompido. Tipo de entrada não é "normal" ou não há um "inviter".');
          return;
      }
      
      const inviter = invite.inviter;
      try {
          await pool.execute(`CREATE TABLE IF NOT EXISTS user_invites (user_id VARCHAR(255) PRIMARY KEY, username VARCHAR(255), regular INT DEFAULT 0, left_users INT DEFAULT 0, fake INT DEFAULT 0, bonus INT DEFAULT 0)`);
          await pool.execute(`CREATE TABLE IF NOT EXISTS invite_records (joined_id VARCHAR(255) PRIMARY KEY, inviter_id VARCHAR(255) NOT NULL)`);
          await pool.execute(`INSERT INTO user_invites (user_id, username, regular) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE regular = regular + 1, username = VALUES(username)`, [inviter.id, inviter.username]);
          await pool.execute('INSERT INTO invite_records (joined_id, inviter_id) VALUES (?, ?)', [member.id, inviter.id]);
          console.log(`[INDICAÇÃO] ${member.user.tag} entrou convidado por ${inviter.tag}.`);
          const logChannelId = client.config.INVITE_LOG_CHANNEL_ID;
          if (logChannelId) {
              const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
              if (logChannel) {
                  const [inviterData] = await pool.execute(`SELECT (regular + bonus - left_users) as total_invites FROM user_invites WHERE user_id = ?`, [inviter.id]);
                  const totalInvites = inviterData.length > 0 ? inviterData[0].total_invites : 1;
                  const embed = new EmbedBuilder().setColor(0x00FF00).setTitle('🎉 Nova Indicação!').setDescription(`**<@${member.id}>** acaba de entrar na cidade!`).setThumbnail(member.user.displayAvatarURL({ dynamic: true })).addFields({ name: 'Convidado por', value: `<@${inviter.id}>`, inline: true },{ name: 'Total de Indicações', value: `Agora tem **${totalInvites}**!`, inline: true }).setTimestamp();
                  await logChannel.send({ embeds: [embed] });
              }
          }
      } catch (error) {
          console.error('Erro ao processar entrada por convite:', error);
      }
  });
  // =============================================================== //
  // ============ FIM DO CÓDIGO DO SISTEMA DE INDICAÇÃO ============ //
  // =============================================================== //

  // Carregar handlers
  const handlersPath = path.join(__dirname, 'handlers');
  const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));
  for (const file of handlerFiles) {
    require(`./handlers/${file}`)(client);
  }

  // Iniciar tarefas agendadas
  const backupTask = require('./tasks/backup');
  const cleanupInterviewsTask = require('./tasks/cleanupInterviews'); // Carrega a tarefa de limpeza

  const backupJob = cron.schedule('0 */2 * * *', () => backupTask(client));
  const cleanupJob = cron.schedule('*/10 * * * *', () => cleanupInterviewsTask(client)); // Executa a limpeza a cada 10 minutos

  // Configurar limpeza de recursos ao desligar
  const cleanup = () => {
    console.log('Desligando bot...');
    if (client.statusUpdateInterval) {
      clearInterval(client.statusUpdateInterval);
    }
    backupJob.stop();
    cleanupJob.stop(); // Para a tarefa de limpeza ao desligar
    console.log('Recursos limpos. Desligando...');
    process.exit(0);
  };

  // Registrar handlers de desligamento
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('uncaughtException', (error) => {
    console.error('Erro não tratado:', error);
    cleanup();
  });

  // Login do bot
  if (config.BOT_TOKEN) {
    client.login(config.BOT_TOKEN).catch(err => {
      console.error('Erro ao fazer login com o token fornecido:', err);
      console.log('Verifique se o token é válido e tente novamente.');
    });
  } else {
    console.log('Token do bot não configurado. Use o comando /config após adicionar o bot ao servidor.');
    console.log('Para a primeira execução, você precisa editar manualmente o arquivo config/config.json e adicionar pelo menos o BOT_TOKEN.');
    if (!fs.existsSync(configPath)) {
      const basicConfig = {
        BOT_TOKEN: "INSIRA_SEU_TOKEN_AQUI",
        CLIENT_ID: "",
        GUILD_ID: "",
        DB_HOST: "localhost",
        DB_USER: "root",
        DB_PASSWORD: "",
        DB_NAME: "fivem_db",
        HOST_FIVEM: "localhost",
        PORT_FIVEM: "30120",
        CFX_CODE: "",
        CONNECT_DOMAIN: "",
        ROLES: {},
        LOGS: {
          "WEBHOOK_URL": ""
        },
        SOCIAL: {},
        roleSystem: {
          type: "auto",
          verificationChannel: "",
          verificationMessage: "Clique no botão abaixo para verificar sua conta e obter acesso ao servidor.",
          verificationButtonLabel: "Verificar",
          verificationButtonEmoji: "✅"
        }
      };
      if (!fs.existsSync(path.join(__dirname, 'config'))) {
        fs.mkdirSync(path.join(__dirname, 'config'), { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(basicConfig, null, 2));
      console.log(`Arquivo de configuração básico criado em ${configPath}`);
      console.log('Edite este arquivo para adicionar seu token e reinicie o bot.');
    }
  }
}

startBot().catch(error => {
  console.error('Erro ao iniciar o bot:', error);
  process.exit(1);
});