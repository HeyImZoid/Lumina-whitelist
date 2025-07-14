import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js"
import { Whitelist, Cooldown } from "../db.js"

function generateKey(length = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// 📅 30 days in milliseconds
const COOLDOWN_DURATION = 30 * 24 * 60 * 60 * 1000;
const ALLOWED_ROLE_ID = '1393257298784161916'; // replace with real role ID
const KEYS_PER_CLAIM = 5;

export default {
  data: new SlashCommandBuilder()
  .setName("claim")
  .setDescription("Claim monthly giveaway 5 keys (YOUTUBERS ONLY)")
  .setDMPermission(false),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const member = interaction.member
    const youtubeRole = interaction.guild.roles.cache.get("1393257298784161916")

    if(!member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({ content: "❌ This command is designed for YouTubers only.", ephemeral: true })
    }

    const existingCooldown = await Cooldown.findOne({ where: { discordId: member.id } })
    const now = new Date()

    if(existingCooldown) {
      const lastClaimed = new Date(existingCooldown.lastClaimed)
      const timeDiff = now - lastClaimed

      if(timeDiff < COOLDOWN_DURATION) {
        const remaining = Math.ceil((COOLDOWN_DURATION - timeDiff) / (1000 * 60 * 60 * 24))
        
        const embedErr = new EmbedBuilder()
        .setDescription(`⚠️ You can claim your monthly keys again in ${remaining} days.`)
        .setColor("Red")
        return interaction.reply({ embeds: [embedErr], ephemeral: true })
      }
    }

    const keys = [];

    for(let i = 0; i < KEYS_PER_CLAIM; i++) {
      const key = generateKey();
      await Whitelist.create({
        key,
        robloxUsername: "N/A",
        discordId: "N/A",
        whitelistType: "Standard",
      });
      keys.push(key);
    }

    if(existingCooldown) {
      existingCooldown.lastClaimed = now;

      await existingCooldown.save();
    } else {
      await Cooldown.create({
        discordId: member.id,
        lastClaimed: now,
      })
    }

    const embed = new EmbedBuilder()
    .setTitle("🎁 Monthly Keys Claimed")
    .setDescription(`We appreciate your support! Here are your monthly keys: \n\n${keys.map((k, i) => `**${i + 1}.** \`${k}\``).join('\n')}`)
    .setColor("Green")

    try {
      await interaction.user.send({ embeds: [embed] })
      await interaction.reply({ content: "✅ Your monthly keys have been sent to your DMs", ephemeral: true })
    } catch(error) {
      console.error(`❌ Failed to send DM to ${member.user.username}: ${error}`)
      await interaction.reply({ content: "✅ Keys generated but i couldn't DM you, Please open your DMs, If the problem still occurs please contact the developer **ali0_a**.", ephemeral: true })
    }
  }
}