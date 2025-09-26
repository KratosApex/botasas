const pool = require('../config/database');
const logger = require('../utils/logger');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member, client) {
    // --- LÓGICA ANTI-LEAVE (JÁ EXISTENTE) ---
    try {
      const [rows] = await pool.execute('SELECT * FROM summerz_accounts WHERE discord = ?', [member.id]);
      if (rows.length > 0) {
        await pool.execute('UPDATE summerz_accounts SET whitelist = 0 WHERE discord = ?', [member.id]);
        await logger.logDatabase(
          "Whitelist Removida (Anti-Leave)", 
          `Usuário: ${member.user.tag} (${member.id})\nID na conta: ${rows[0].id}`
        );
        console.log(`Whitelist removida do usuário ${member.user.tag} (ID: ${member.id}) por ter saído do servidor.`);
      }
    } catch (error) {
      console.error('Erro ao remover whitelist:', error);
      await logger.logError("Evento guildMemberRemove (Anti-Leave)", error);
    }

    // --- LÓGICA DO SISTEMA DE INDICAÇÃO ---
    try {
        // Procura quem convidou o membro que saiu
        const [record] = await pool.execute('SELECT inviter_id FROM invite_records WHERE joined_id = ?', [member.id]);
        
        if (record.length > 0) {
            const inviterId = record[0].inviter_id;

            // Atualiza a contagem de SAÍDAS de quem convidou
            await pool.execute(
                'UPDATE user_invites SET left_users = left_users + 1 WHERE user_id = ?',
                [inviterId]
            );

            // Remove o registo de convite
            await pool.execute('DELETE FROM invite_records WHERE joined_id = ?', [member.id]);

            const inviter = await client.users.fetch(inviterId);
            console.log(`[INDICAÇÃO] ${member.user.tag} saiu. Era um convidado de ${inviter.tag}.`);
        }
    } catch (error) {
        console.error('Erro ao processar saída de membro convidado:', error);
        await logger.logError("Evento guildMemberRemove (Indicação)", error);
    }
  },
};