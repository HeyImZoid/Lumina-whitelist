import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js"

export default {
  data: new SlashCommandBuilder()
  .setName("eval")
  .setDescription("Evaluates Code (DEVELOPER ONLY)")
  .setDMPermission(false)
   .addStringOption(option => option.setName("code")
                   .setDescription("The code to evaluate")
                   .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const OWNER_IDS = ["888079339323789363"]

    if(!OWNER_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: "❌ You are not authorized to use this command.", ephemeral: true })
    }

    const inputCode = interaction.options.getString("code")

    try {
    let evaled = await eval(`(async () => { ${inputCode} })()`)

      if(typeof evaled !== "string") {
        const util = await import('node:util');
evaled = util.inspect(evaled, { depth: 1 });
      }

      const embed = new EmbedBuilder()
      .setTitle("Code Evaluation")
      .setDescription("Successfully evaluated code.")
      .setColor("Green")
      await interaction.reply({ embeds: [embed], ephemeral: true })
    } catch(error) {
      const embedErr = new EmbedBuilder()
        .setTitle('❌ Evaluation Error')
        .setDescription(`\`\`\`js\n${error.toString().slice(0, 1950)}\n\`\`\``)
      .setColor("Red")

      return interaction.reply({ embeds: [embedErr], ephemeral: true })
    }
  }
}