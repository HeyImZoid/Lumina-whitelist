import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js"
const REPORT_LOG_CHANNEL_ID = "1393972792348901467"
const reportCooldowns = new Map()

export default {
  data: new SlashCommandBuilder()
  .setName("report-user")
  .setDescription("Report a whitelisted user for suspicious activity or breaking the terms of service.")
  .setDMPermission(false)
  .addUserOption(option => option.setName("user")
                .setDescription("The user to report.")
                .setRequired(true))
    .addStringOption(option => option.setName("type")
                    .setDescription("The type of report.")
    .addChoices(
      { name: "Suspicious Activity", value: "suspecious activity"},
      { name: "Breaking Terms of Service", value: "tos"},
      { name: "Other", value: "other"}
    )
                    .setRequired(true))
  .addStringOption(option => option.setName("reason")
                  .setDescription("The reason for reporting this whitelisted user.")
                  .setRequired(true))
    .addAttachmentOption(option => option.setName("evidence")
                        .setDescription("Evidence or proof of the report.")
                        .setRequired(true)),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const reportedUser = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason")
    const type = interaction.options.getString("type")
    const evidence = interaction.options.getAttachment("evidence")
    const userId = interaction.user.id
    const now = Date.now()

    if(reportCooldowns.has(userId)) {
      const lastUsed = reportCooldowns.get(userId)
      const remaining = 10 * 1000 - (now - lastUsed);

      if(remaining > 0) {
        const seconds = Math.ceil(remaining / 1000)

        return interaction.reply({ content: `❌ Please wait ${seconds} more second(s) before using this command again.`, ephemeral: true })
      }
    }

    reportCooldowns.set(userId, now)
    setTimeout(() => reportCooldowns.delete(userId), 10 * 1000)

    if(reportedUser.bot) {
      return interaction.reply({ content: "❌ You cannot report a bot.", ephemeral: true })
    }

    if(reportedUser.id === interaction.user.id) {
      return interaction.reply({ content: "❌ You cannot report yourself.", ephemeral: true })
    }

    const guild = interaction.guild
    const logChannel = guild.channels.cache.get(REPORT_LOG_CHANNEL_ID)

    if(!logChannel || !logChannel.isTextBased()) {
      return interaction.reply({ content: "❌ Report log channel not found, Please report this issue to the developer **ali0_a**", ephemeral: true })
    }

    const reportEmbed = new EmbedBuilder()
    .setTitle("🚨 User Report")
    .addFields(
      { name: "Reported By (Author)", value: `<@${userId}> (${userId})` },
      { name: "Reported User", value: `<@${reportedUser.id}> (${reportedUser.id})` },
      { name: "Report Type", value: `${type}` },
      { name: "Reason", value: `${reason}` },
      { name: "Evidence", value: evidence ? `[View Evidence](${evidence.url})` : `No evidence provided (Error)`}
    )
    .setColor("Purple")

    try{
    await logChannel.send({ embeds: [reportEmbed] })

    await interaction.reply({ content: "✅ Your report has been submitted, A staff will review your report soon.", ephemeral: true })
    } catch(error) {
     console.error(`❌ Report log failed: ${error}`) 
      await interaction.reply({ content: "❌ Something went wrong while submitting your report, Please try again later, If the problem still occurs please contact the developer **ali0_a**", ephemeral: true })
    }
  }
}