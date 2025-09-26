const { ChannelType } = require('discord.js');

const ONE_HOUR = 60 * 60 * 1000; // Tempo em milissegundos para 1 hora

module.exports = async function(client) {
  console.log('[CLEANUP] A executar a verificação de canais de entrevista antigos...');
  
  const interviewCategoryId = client.config.INTERVIEW_CATEGORY_ID;
  if (!interviewCategoryId) {
    console.log('[CLEANUP] ID da categoria de entrevistas não configurado. A saltar a limpeza.');
    return;
  }

  try {
    const category = await client.channels.fetch(interviewCategoryId);
    if (!category || category.type !== ChannelType.GuildCategory) {
      console.log(`[CLEANUP] Categoria com ID ${interviewCategoryId} não encontrada ou não é uma categoria.`);
      return;
    }

    const now = Date.now();
    let deletedCount = 0;

    // --- CORREÇÃO APLICADA AQUI ---
    // Alterado de category.channels.cache para category.children.cache
    for (const channel of category.children.cache.values()) {
      const channelAge = now - channel.createdTimestamp;

      // Apaga o canal se tiver mais de 1 hora
      if (channelAge > ONE_HOUR) {
        try {
          await channel.delete('Limpeza automática de canal de entrevista antigo.');
          console.log(`[CLEANUP] Canal antigo "${channel.name}" apagado com sucesso.`);
          deletedCount++;
        } catch (error) {
          console.error(`[CLEANUP] Falha ao apagar o canal ${channel.name}:`, error);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[CLEANUP] Limpeza concluída. ${deletedCount} canais foram apagados.`);
    } else {
      console.log('[CLEANUP] Nenhum canal antigo encontrado para apagar.');
    }

  } catch (error) {
    console.error('[CLEANUP] Ocorreu um erro ao executar a tarefa de limpeza de entrevistas:', error);
  }
};