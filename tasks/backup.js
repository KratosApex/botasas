const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const logger = require('../utils/logger');
const mysqldump = require('mysqldump'); // Adicionado o pacote mysqldump

module.exports = async function(client) {
  const date = new Date();
  const fileName = `backup_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}.sql`;
  const filePath = path.join(__dirname, '..', 'backups', fileName);

  // Criar diretório de backups se não existir
  if (!fs.existsSync(path.join(__dirname, '..', 'backups'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'backups'), { recursive: true });
  }

  try {
    // Usar o pacote mysqldump em vez do executável
    await mysqldump({
      connection: {
        host: client.config.DB_HOST,
        user: client.config.DB_USER,
        password: client.config.DB_PASSWORD,
        database: client.config.DB_NAME,
      },
      dumpToFile: filePath
    });

    console.log(`Backup concluído: ${fileName}`);

    // Enviar para o canal de backup
    if (client && client.config.BACKUP_CHANNEL_ID) {
      try {
        const backupChannel = await client.channels.fetch(client.config.BACKUP_CHANNEL_ID);
        if (backupChannel) {
          const fileSize = fs.statSync(filePath).size;

          // Verificar se o arquivo não é muito grande para o Discord (limite de 8MB)
          if (fileSize <= 8 * 1024 * 1024) {
            const attachment = new AttachmentBuilder(filePath, { name: fileName });
            await backupChannel.send({
              content: `📦 Backup automático do banco de dados - ${new Date().toLocaleString()}`,
              files: [attachment]
            });
            await logger.logDatabase("Backup realizado", `Arquivo: ${fileName}\nTamanho: ${(fileSize / 1024 / 1024).toFixed(2)} MB\nEnviado para o canal <#${client.config.BACKUP_CHANNEL_ID}>`);
          } else {
            await backupChannel.send(`⚠️ Backup realizado, mas o arquivo é muito grande para ser enviado (${(fileSize / 1024 / 1024).toFixed(2)} MB). Disponível localmente em: \`backups/${fileName}\``);
            await logger.logDatabase("Backup realizado", `Arquivo: ${fileName}\nTamanho: ${(fileSize / 1024 / 1024).toFixed(2)} MB\nArquivo muito grande para enviar ao Discord. Disponível apenas localmente.`);
          }
        }
      } catch (error) {
        console.error('Erro ao enviar backup para o canal:', error);
        await logger.logError("Sistema de Backup", error);
      }
    }

    // Limpar backups antigos (manter apenas os últimos 10)
    const backupDir = path.join(__dirname, '..', 'backups');
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(backupDir, file));

    if (files.length > 5) {
      // Ordenar por data de modificação (mais antigos primeiro)
      files.sort((a, b) => fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime());

      // Remover os mais antigos
      for (let i = 0; i < files.length - 10; i++) {
        fs.unlinkSync(files[i]);
        console.log(`Backup antigo removido: ${path.basename(files[i])}`);
      }
    }
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    await logger.logError("Sistema de Backup", error);
  }
};
