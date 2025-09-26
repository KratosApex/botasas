const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addcarro')
    .setDescription('Adiciona um veículo à garagem de um jogador')
    .addIntegerOption(option => 
      option.setName('id')
        .setDescription('ID do jogador')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('veiculo')
        .setDescription('Nome do veículo')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('placa')
        .setDescription('Placa do veículo (opcional)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, client) {
    const id = interaction.options.getInteger('id');
    const veiculo = interaction.options.getString('veiculo');
    const placa = interaction.options.getString('placa') || gerarPlaca();

    try {
      // Verificar se o jogador existe
      const [userRows] = await pool.execute('SELECT * FROM characters WHERE id = ?', [id]);
      
      if (userRows.length === 0) {
        await logger.logCommand(
          interaction, 
          "Falha ao adicionar veículo", 
          `Jogador com ID ${id} não encontrado.`
        );
        return interaction.reply({ content: `❌ Jogador com ID ${id} não encontrado!`, flags: 64 });
      }

      // Verificar se o jogador já possui este veículo
      const [vehicleRows] = await pool.execute('SELECT * FROM vehicles WHERE Passport = ? AND vehicle = ?', [id, veiculo]);
      
      if (vehicleRows.length > 0) {
        await logger.logCommand(
          interaction, 
          "Falha ao adicionar veículo", 
          `Jogador com ID ${id} já possui o veículo ${veiculo}.`
        );
        return interaction.reply({ content: `❌ O jogador já possui um veículo ${veiculo} em sua garagem!`, flags: 64 });
      }

      // Adicionar o veículo
      const doors = JSON.stringify([0,0,0,0,0,0,0,0]);
      const windows = JSON.stringify([1,1,1,1,1,1,1,1]);
      const tyres = JSON.stringify([1,1,1,1,1,1,1]);
      
      await pool.execute(
        'INSERT INTO vehicles (Passport, vehicle, plate, doors, windows, tyres, work) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, veiculo, placa, doors, windows, tyres, 'false']
      );
      
      await logger.logCommand(
        interaction, 
        "Veículo adicionado", 
        `ID: ${id}\nVeículo: ${veiculo}\nPlaca: ${placa}`
      );
      
      return interaction.reply({ content: `✅ Veículo ${veiculo} adicionado com sucesso à garagem do jogador ${id} com a placa ${placa}!`, flags: 64 });
    } catch (error) {
      console.error(error);
      await logger.logError(`Comando ${interaction.commandName}`, error);
      return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
    }
  },
};

// Função para gerar placa aleatória
function gerarPlaca() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  let placa = '';
  
  for (let i = 0; i < 3; i++) {
    placa += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  
  placa += '-';
  
  for (let i = 0; i < 4; i++) {
    placa += numeros.charAt(Math.floor(Math.random() * numeros.length));
  }
  
  return placa;
}
