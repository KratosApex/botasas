const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = async (client) => {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      } else {
        console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "data" ou "execute" obrigatória.`);
      }
    }
  }

  // Verificar se temos os IDs necessários antes de registrar os comandos
  if (!client.config.CLIENT_ID || !client.config.GUILD_ID) {
    console.log('[AVISO] CLIENT_ID ou GUILD_ID não configurados. Os comandos slash não serão registrados.');
    console.log('Use o comando /config após configurar o bot para registrar os comandos.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(client.config.BOT_TOKEN);

  try {
    console.log(`Iniciando atualização de ${commands.length} comandos (/).`);

    const data = await rest.put(
      Routes.applicationGuildCommands(client.config.CLIENT_ID, client.config.GUILD_ID),
      { body: commands },
    );

    console.log(`Atualização bem-sucedida de ${data.length} comandos (/).`);
  } catch (error) {
    console.error('Erro ao registrar comandos slash:', error);
  }
};
