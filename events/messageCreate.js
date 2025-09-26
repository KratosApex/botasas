const { Events } = require('discord.js');
const pool = require('../config/database');

// Cooldown para evitar spam
const cooldowns = new Map();
const COOLDOWN_TIME = 60000; // 1 minuto em milissegundos

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Ignorar mensagens de bots e DMs
        if (message.author.bot || !message.guild) return;
        
        const userId = message.author.id;
        
        // Verificar cooldown
        if (cooldowns.has(userId)) {
            const cooldownEnd = cooldowns.get(userId);
            if (Date.now() < cooldownEnd) return;
        }
        
        // Definir cooldown
        cooldowns.set(userId, Date.now() + COOLDOWN_TIME);
        
        try {
            // Criar tabela se não existir
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS user_ranking (
                    user_id VARCHAR(20) PRIMARY KEY,
                    username VARCHAR(100) NOT NULL,
                    points INT DEFAULT 0,
                    level INT DEFAULT 1,
                    last_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Verificar se o usuário já existe
            const [rows] = await pool.execute('SELECT * FROM user_ranking WHERE user_id = ?', [userId]);
            
            if (rows.length === 0) {
                // Criar novo usuário
                await pool.execute(`INSERT INTO user_ranking (user_id, username, points, level) VALUES (?, ?, ?, ?) 
ON DUPLICATE KEY UPDATE username=VALUES(username), points=points + 10, level=GREATEST(level, FLOOR((points + 10) / 100) + 1)`, 
[userId, message.author.username, 10, 1]);

            } else {
                // Atualizar pontos do usuário
                const currentPoints = rows[0].points;
                const currentLevel = rows[0].level;
                
                // Adicionar pontos (10 por mensagem)
                const newPoints = currentPoints + 10;
                
                // Calcular novo nível (a cada 100 pontos)
                const newLevel = Math.floor(newPoints / 100) + 1;
                
                // Atualizar banco de dados
                await pool.execute(
                    'UPDATE user_ranking SET points = ?, level = ?, username = ?, last_message = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [newPoints, newLevel, message.author.username, userId]
                );
                
                // Se o usuário subiu de nível, enviar mensagem
                if (newLevel > currentLevel) {
                    message.channel.send(`🎉 Parabéns ${message.author}! Você subiu para o nível ${newLevel}!`);
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar ranking:', error);
        }
    },
};
