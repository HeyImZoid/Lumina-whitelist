import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js"
import { Whitelist } from "../db.js"

export default {
  data: new SlashCommandBuilder()
  .setName("revoke")
  .setDescription("Revoke a whitelist key (DEVELOPER ONLY)")
  .addUserOption(option => option.setName("user")
                  .setDescription("The user to revoke the key for.")
                  .setRequired(true))
    .addStringOption(option => option.setName("reason")
                    .setDescription("The reason for revoking the whitelist.")
                    .setRequired(true)
                    .setMinLength(15)
                    .setMaxLength(200))
  .setDMPermission(false),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const targetUser = interaction.options.getUser("user")
    const guild = interaction.guild
    const staffRole = interaction.guild.roles.cache.get("1393240669568635072");
  const reason = interaction.options.getString("reason")
    const member = await guild.members.fetch(targetUser.id).catch(() => null)

    if (interaction.member.roles.highest.position <= staffRole.position) {
      const errorEmbed = new EmbedBuilder()
        .setDescription("You do not have the permissions to use this command.")
        .setColor("Red");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    if(targetUser.id === interaction.client.user.id) {
      return interaction.reply({ content: "❌ You cannot revoke the bot.", ephemeral: true })
    }
    
    const entry = await Whitelist.findOne({ where: { discordId: targetUser.id } })

    if(!entry) {
      return interaction.reply({ content: "❌ This user is not whitelisted to revoke their whitelist.", ephemeral: true })
    }

    const standardRoleId = "1393240522281324614"
    const premiumRoleId = "1393240594167496875";

    const roleIdToRemove = entry.whitelistType === "Premium" ? premiumRoleId : standardRoleId;

    if(member && member.roles.cache.has(roleIdToRemove)) {
      try {
        await member.roles.remove(roleIdToRemove)
      } catch(err) {
        console.error(`⚠️ Failed to remove role from ${member.user.username}: ${err}`)
      }
    }

    await entry.destroy()

    // ✅ Logging to staff channel
const logChannelId = '1393256961780220134';
const logChannel = guild.channels.cache.get(logChannelId);

if (logChannel && logChannel.isTextBased()) {
  const logEmbed = new EmbedBuilder()
    .setTitle('📥 Whitelist log: Revoke')
    .addFields(
      { name: "Moderator", value: `<@${interaction.user.id}> (${interaction.user.id})`},
      { name: "Revoked User", value: `<@${targetUser.id}> (${targetUser.id})`},
      { name: "Whitelist Type", value: `${entry.whitelistType || "Standard"}`},
      { name: "Revoked User Roblox Username", value: `${entry.robloxUsername}`},
      { name: "Reason", value: `${reason}`},
    )
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [logEmbed] });
  } catch (logErr) {
    console.error(`❌ Failed to send log to channel: ${logErr}`);
  }
}

    // ✅ DM the user (if possible)
try {
  const dmEmbed = new EmbedBuilder()
    .setTitle('🚫 Whitelist Revoked')
    .setDescription('Your whitelist access has been revoked, If you believe this was a mistake please contact a staff member.')
    .addFields(
      { name: 'Roblox Username', value: entry.robloxUsername },
      { name: 'Whitelist Type', value: entry.whitelistType || 'Standard' },
      { name: "Reason", value: `${reason}`},
    )
    .setColor("Red")
    .setTimestamp();

  await targetUser.send({ embeds: [dmEmbed] });
} catch (dmError) {
  console.warn(`⚠️ Could not DM ${targetUser.tag}:`, dmError);
}

    const embed = new EmbedBuilder()
    .setTitle("🚫 Whitelist Revoked")
    .addFields(
      { name: "User", value: `<@${targetUser.id}>`},
      { name: "Whitelist Type", value: `${entry.whitelistType || "Standard"}`},
      { name: "Roblox Username", value: `${entry.robloxUsername}`}
    )
     .setColor("Green")
    return interaction.reply({ embeds: [embed], ephemeral: true })
    
  }
}