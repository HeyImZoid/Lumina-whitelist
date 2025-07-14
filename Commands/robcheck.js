import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder
} from "discord.js"
import { Whitelist } from "../db.js"
import fetch from 'node-fetch';

async function getRobloxUserInfo(username) {
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: true
      })
    });

    const data = await res.json();
    if (!data || !data.data || data.data.length === 0) return null;

    const userInfo = data.data[0];
    return {
      id: userInfo.id.toString(),
      username: userInfo.name
    };
  } catch (err) {
    console.error('❌ Roblox API error:', err);
    return null;
  }
}

export default {
  data: new SlashCommandBuilder()
  .setName("blox-check")
  .setDescription("Lookup a whitelisted user data via roblox username.")
  .addStringOption(option => option.setName("username")
                  .setDescription("The roblox username to lookup.")
                  .setRequired(true))
  .setDMPermission(false),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const inputUsername = interaction.options.getString("username")
    const robloxInfo = await getRobloxUserInfo(inputUsername)

    if(!robloxInfo) {
      return interaction.reply({ content: "❌ Invalid Roblox username.", ephemeral: true })
    }

    const entry = await Whitelist.findOne({ where: { robloxId: robloxInfo.id } })

    if(!entry) {
      return interaction.reply({ content: "❌ This username is not whitelisted.", ephemeral: true })
    }

    const embed = new EmbedBuilder()
    .setTitle("🔎 Profile Lookup")
    .addFields(
      { name: "Discord User", value: `<@${entry.discordId}>`},
      { name: "Roblox Username", value: `${entry.robloxUsername}`},
      { name: "Roblox ID", value: `${robloxInfo.id}`},
      { name: "Whitelist Type", value: `${entry.whitelistType || "Standard"}`}
    )
    .setColor("Green")
    return interaction.reply({ embeds: [embed] })
  }
}