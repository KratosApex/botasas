const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('baterponto')
    .setDescription('Sistema de ponto para staffs')
    .addSubcommand(subcommand =>
      subcommand
        .setName('entrar')
        .setDescription('Registra entrada de ponto'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('sair')
        .setDescription('Registra saída de ponto'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('relatorio')
        .setDescription('Exibe relatório de pontos')
        .addUserOption(option => 
          option.setName('usuario')
            .setDescription('Usuário para verificar (apenas para admins)')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const pontosDir = path.join(__dirname, '..', '..', 'data', 'pontos');
    
    // Garantir que o diretório existe
    if (!fs.existsSync(pontosDir)) {
      fs.mkdirSync(pontosDir, { recursive: true });
    }
    
    const pontoFile = path.join(pontosDir, `${interaction.user.id}.json`);
    let pontoData = { pontos: [] };
    
    // Carregar dados existentes
    if (fs.existsSync(pontoFile)) {
      try {
        pontoData = JSON.parse(fs.readFileSync(pontoFile, 'utf8'));
      } catch (error) {
        console.error('Erro ao ler arquivo de ponto:', error);
      }
    }
    
    if (subcommand === 'entrar') {
      // Verificar se já está em serviço
      const ultimoPonto = pontoData.pontos[pontoData.pontos.length - 1];
      if (ultimoPonto && !ultimoPonto.saida) {
        return interaction.reply({ 
          content: `❌ Você já está em serviço desde <t:${Math.floor(ultimoPonto.entrada / 1000)}:F>. Use \`/baterponto sair\` para encerrar.`, 
          flags: 64 
        });
      }
      
      // Registrar entrada
      pontoData.pontos.push({
        entrada: Date.now(),
        saida: null
      });
      
      fs.writeFileSync(pontoFile, JSON.stringify(pontoData, null, 2));
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Ponto Registrado')
        .setDescription(`<@${interaction.user.id}> entrou em serviço.`)
        .addFields(
          { name: 'Entrada', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();
      
      await logger.logCommand(
        interaction, 
        "Ponto - Entrada", 
        `Usuário: <@${interaction.user.id}>\nHorário: <t:${Math.floor(Date.now() / 1000)}:F>`
      );
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'sair') {
      // Verificar se está em serviço
      const ultimoPonto = pontoData.pontos[pontoData.pontos.length - 1];
      if (!ultimoPonto || ultimoPonto.saida) {
        return interaction.reply({ 
          content: `❌ Você não está em serviço. Use \`/baterponto entrar\` para iniciar.`, 
          flags: 64 
        });
      }
      
      // Registrar saída
      ultimoPonto.saida = Date.now();
      const duracao = ultimoPonto.saida - ultimoPonto.entrada;
      const horas = Math.floor(duracao / (1000 * 60 * 60));
      const minutos = Math.floor((duracao % (1000 * 60 * 60)) / (1000 * 60));
      
      fs.writeFileSync(pontoFile, JSON.stringify(pontoData, null, 2));
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Ponto Encerrado')
        .setDescription(`<@${interaction.user.id}> saiu de serviço.`)
        .addFields(
          { name: 'Entrada', value: `<t:${Math.floor(ultimoPonto.entrada / 1000)}:F>`, inline: true },
          { name: 'Saída', value: `<t:${Math.floor(ultimoPonto.saida / 1000)}:F>`, inline: true },
          { name: 'Duração', value: `${horas}h ${minutos}min`, inline: true }
        )
        .setTimestamp();
      
      await logger.logCommand(
        interaction, 
        "Ponto - Saída", 
        `Usuário: <@${interaction.user.id}>\nHorário: <t:${Math.floor(Date.now() / 1000)}:F>\nDuração: ${horas}h ${minutos}min`
      );
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'relatorio') {
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      
      // Verificar permissões para ver relatório de outros
      if (targetUser.id !== interaction.user.id) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const isAdmin = member.roles.cache.has(client.config.ROLES.ADMIN);
        
        if (!isAdmin) {
          return interaction.reply({ 
            content: `❌ Você não tem permissão para ver o relatório de outros usuários.`, 
            flags: 64 
          });
        }
      }
      
      const targetPontoFile = path.join(pontosDir, `${targetUser.id}.json`);
      let targetPontoData = { pontos: [] };
      
      if (fs.existsSync(targetPontoFile)) {
        try {
          targetPontoData = JSON.parse(fs.readFileSync(targetPontoFile, 'utf8'));
        } catch (error) {
          console.error('Erro ao ler arquivo de ponto:', error);
        }
      }
      
      if (targetPontoData.pontos.length === 0) {
        return interaction.reply({ 
          content: `Não há registros de ponto para ${targetUser.id === interaction.user.id ? 'você' : targetUser.username}.`, 
          flags: 64 
        });
      }
      
      // Calcular estatísticas
      let totalMs = 0;
      let ultimosDias = 0;
      const hoje = new Date();
      const ultimosPontos = [];
      
      // Pegar os últimos 7 dias de pontos
      targetPontoData.pontos.forEach(ponto => {
        if (ponto.entrada && ponto.saida) {
          const pontoData = new Date(ponto.entrada);
          const diffDias = Math.floor((hoje - pontoData) / (1000 * 60 * 60 * 24));
          
          if (diffDias < 7) {
            ultimosPontos.push(ponto);
            totalMs += (ponto.saida - ponto.entrada);
            
            // Contar dias únicos
            const diaStr = pontoData.toISOString().split('T')[0];
            if (!ultimosDias[diaStr]) {
              ultimosDias[diaStr] = true;
            }
          }
        }
      });
      
      const totalHoras = Math.floor(totalMs / (1000 * 60 * 60));
      const totalMinutos = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Relatório de Ponto - ${targetUser.username}`)
        .addFields(
          { name: 'Total de Horas (7 dias)', value: `${totalHoras}h ${totalMinutos}min`, inline: true },
          { name: 'Dias Trabalhados (7 dias)', value: `${Object.keys(ultimosDias).length} dias`, inline: true }
        )
        .setTimestamp();
      
      // Adicionar últimos 5 pontos
      const ultimosRegistros = targetPontoData.pontos.slice(-5).reverse();
      if (ultimosRegistros.length > 0) {
        let registrosText = '';
        
        ultimosRegistros.forEach((ponto, index) => {
          const entradaData = new Date(ponto.entrada);
          const entradaStr = `<t:${Math.floor(ponto.entrada / 1000)}:F>`;
          
          if (ponto.saida) {
            const saidaStr = `<t:${Math.floor(ponto.saida / 1000)}:F>`;
            const duracao = ponto.saida - ponto.entrada;
            const horas = Math.floor(duracao / (1000 * 60 * 60));
            const minutos = Math.floor((duracao % (1000 * 60 * 60)) / (1000 * 60));
            
            registrosText += `**${index + 1}.** Entrada: ${entradaStr}\nSaída: ${saidaStr}\nDuração: ${horas}h ${minutos}min\n\n`;
          } else {
            registrosText += `**${index + 1}.** Entrada: ${entradaStr}\nSaída: Em serviço\n\n`;
          }
        });
        
        embed.addFields({ name: 'Últimos Registros', value: registrosText });
      }
      
      await logger.logCommand(
        interaction, 
        "Ponto - Relatório", 
        `Solicitado por: <@${interaction.user.id}>\nUsuário consultado: <@${targetUser.id}>`
      );
      
      return interaction.reply({ embeds: [embed] });
    }
  },
};
