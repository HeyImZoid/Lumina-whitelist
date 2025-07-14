import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

import { Cooldown } from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resetcooldown')
    .setDescription('Reset the cooldown for a user. (DEVELOPER ONLY)')
    .setDMPermission(false)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose cooldown should be reset.')
        .setRequired(true)
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const ownerRole = interaction.guild.roles.cache.get("1393240796760899727")

    if (interaction.member.roles.highest.position <= ownerRole.position) {
      const errorEmbed = new EmbedBuilder()
        .setDescription("You do not have the permissions to use this command.")
        .setColor("Red");

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const existing = await Cooldown.findOne({ where: { discordId: target.id } });

    if (!existing) {
      return interaction.reply({
        content: `ℹ️ No cooldown found for <@${target.id}>.`,
        ephemeral: true
      });
    }

    await existing.update({ lastClaimed: new Date(0) }); // or .update({ lastClaimed: null }) if you'd rather reset

    const embed = new EmbedBuilder()
      .setTitle('🔁 Cooldown Reset')
      .setDescription(`Cooldown for <@${target.id}> has been successfully reset.`)
      .setColor("Green")

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};