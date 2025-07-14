import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js"
import { Whitelist } from "../db.js"

export default {
  data: new SlashCommandBuilder()
  .setName("dis-check")
  .setDescription("Lookup a whitelisted user via their discord.")
  .addUserOption(option => option.setName("user")
          .setDescription("The user to lookup.")
                .setRequired(true))
  .setDMPermission(false),
  /**
   * @parm {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const targetUser = interaction.options.getUser("user")
    const entry = await Whitelist.findOne({ where: { discordId: targetUser.id }})

    if(!entry) {
      const embedErr = new EmbedBuilder()
      .setTitle("❌ User Not Found")
      .setDescription(`The user you are looking up (<@${targetUser.id}>) is not whitelisted.`)
      .setColor("Red")
      return interaction.reply({ embeds: [embedErr], ephemeral: true })
    }

    const embed = new EmbedBuilder()
    .setTitle("🔎 Profile Lookup")
    .addFields(
      { name: "Discord User", value: `<@${targetUser.id}>`},
      { name: "Roblox Username", value: `${entry.robloxUsername}`},
      { name: "Roblox ID", value: `${entry.robloxId || "Not Linked/Not Found."}`},
      { name: "Whitelist Type", value: `${entry.whitelistType || "Standard"}`},
    )
    .setColor("Green")
    await interaction.reply({ embeds: [embed] })
  }
}