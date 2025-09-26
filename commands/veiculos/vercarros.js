const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const pool = require('../../config/database');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vercarros')
        .setDescription('Lista todos os veículos de um jogador')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('ID do jogador')
                .setRequired(true))
        // Definir que apenas administradores podem usar este comando
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        // Verificação adicional de permissão
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await logger.logCommand(
                interaction,
                "Tentativa de acesso não autorizado",
                `Usuário ${interaction.user.tag} tentou usar o comando sem permissão`
            );
            return interaction.reply({ 
                content: '❌ Você não tem permissão para usar este comando. Apenas administradores podem verificar veículos de jogadores.', 
                flags: 64 
            });
        }

        const id = interaction.options.getInteger('id');

        try {
            // Verificar se o jogador existe
            const [userRows] = await pool.execute('SELECT * FROM characters WHERE id = ?', [id]);
            if (userRows.length === 0) {
                await logger.logCommand(
                    interaction,
                    "Consulta de veículos",
                    `Jogador com ID ${id} não encontrado.`
                );
                return interaction.reply({ content: `❌ Jogador com ID ${id} não encontrado!`, flags: 64 });
            }

            // Buscar veículos do jogador
            const [vehicleRows] = await pool.execute('SELECT * FROM vehicles WHERE Passport = ?', [id]);
            if (vehicleRows.length === 0) {
                await logger.logCommand(
                    interaction,
                    "Consulta de veículos",
                    `Jogador com ID ${id} não possui veículos.`
                );
                return interaction.reply({ content: `O jogador com ID ${id} não possui veículos.`, flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Veículos do Jogador - ID: ${id}`)
                .setDescription(`${userRows[0].name} ${userRows[0].name2} possui ${vehicleRows.length} veículos.`)
                .setTimestamp();

            // Adicionar informações de cada veículo
            vehicleRows.forEach((veiculo, index) => {
                embed.addFields({
                    name: `${index + 1}. ${veiculo.vehicle}`,
                    value: `Placa: ${veiculo.plate || 'N/A'}\nMotor: ${veiculo.engine}/1000\nCombustível: ${veiculo.fuel}%\nNitro: ${veiculo.nitro}%`,
                    inline: true
                });
            });

            await logger.logCommand(
                interaction,
                "Consulta de veículos",
                `ID: ${id}\nNome: ${userRows[0].name} ${userRows[0].name2}\nTotal de veículos: ${vehicleRows.length}`
            );

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await logger.logError(`Comando ${interaction.commandName}`, error);
            return interaction.reply({ content: '❌ Ocorreu um erro ao processar o comando.', flags: 64 });
        }
    },
};
