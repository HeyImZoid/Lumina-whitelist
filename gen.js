import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder
} from "discord.js";

import { Whitelist } from "../db.js";

function generateKey(length = 20) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export default {
  data: new SlashCommandBuilder()
    .setName("generate")
    .setDescription("Generates one or more whitelist keys.")
    .setDMPermission(false)
    .addStringOption(option =>
      option.setName("type")
        .setDescription("The type of whitelist key to generate.")
        .addChoices(
          { name: "Standard", value: "Standard" },
          { name: "Premium", value: "Premium" },
        )
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("The amount of keys to generate. (OPTIONAL)")
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const staffRole = interaction.guild.roles.cache.get("1393240669568635072");
    const whitelistType = interaction.options.getString("type");
    let amount = interaction.options.getInteger("amount");
    if (!amount || isNaN(amount) || amount < 1) amount = 1;

    const generatedKeys = [];

    if (interaction.member.roles.highest.position <= staffRole.position) {
      const errorEmbed = new EmbedBuilder()
        .setDescription("You do not have the permissions to use this command.")
        .setColor("Red");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    for (let i = 0; i < amount; i++) {
      const key = generateKey(); // ✅ now called inside the loop
      try {
        await Whitelist.create({
          key,
          robloxUsername: "N/A",
          discordId: "N/A",
          robloxId: "N/A",
          whitelistType
        });
        generatedKeys.push(key);
      } catch (err) {
        console.error(`❌ Failed to save key ${key} to database:`, err);
      }
    }

    if (generatedKeys.length === 0) {
      return interaction.reply({
        content: "❌ Failed to generate any keys.",
        ephemeral: true
      });
    }

    const formattedKeys = generatedKeys.map((k, i) => `**${i + 1}.** \`${k}\``).join("\n");

    const dmEmbed = new EmbedBuilder()
      .setTitle("🔐 Whitelist Keys")
      .addFields(
        { name: "Keys", value: formattedKeys },
        { name: "Type", value: whitelistType },
        {
          name: "Instructions",
          value: "Send these keys to the buyer. They will use the `/redeem` command to activate them."
        }
      )
      .setColor(whitelistType === "Premium" ? 0xf1c40f : 0x00b894);

    try {
      await interaction.user.send({ embeds: [dmEmbed] });

      await interaction.reply({
        content: `✅ ${amount} key(s) generated and sent to your DMs.`,
        ephemeral: true
      });
    } catch {
      await interaction.reply({
        content: `❌ Keys generated but I couldn't DM you. Please check your DM settings.`,
        ephemeral: true
      });
    }
  }
};