import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder
} from "discord.js";

import { Whitelist } from "../db.js";

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
    console.error('❌ Failed to contact Roblox API:', err);
    return null;
  }
}

async function isValidRobloxUsername(username) {
  try {
    const response = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: true
      })
    })
    const data = await response.json();
    return data?.data?.length > 0;
  } catch(error) {
    console.error(`❌ Failed to validate Roblox username, ${error}`)
    return false;
  }
}

export default {
  data: new SlashCommandBuilder()
  .setName("redeem")
  .setDescription("Redeem a whitelist key.")
  .addStringOption(option => option.setName("key")
                  .setDescription("The whitelist key to redeem.")
                  .setRequired(true))
  .addStringOption(option => option.setName("username")
                  .setDescription("Your roblox username.")
                  .setRequired(true))
  .setDMPermission(false),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const inputKey = interaction.options.getString("key")
    const robloxUsername = interaction.options.getString("username")
    const userId = interaction.user.id
    const alreadyWhitelisted = await Whitelist.findOne({ where: { discordId: userId }})

    if(alreadyWhitelisted) {
      const error1 = new EmbedBuilder()
      .setTitle(`⚠️ Already Whitelisted`)
      .addFields(
        { name: "Roblox Username", value: `${alreadyWhitelisted.robloxUsername}`},
        { name: "Whitelist Type", value: `${alreadyWhitelisted.whitelistType}`},
      )
      .setColor("Red")
      return interaction.reply({ embeds: [error1], ephemeral: true })
    }

    // ✅ Validate username and get ID
    const robloxInfo = await getRobloxUserInfo(robloxUsername);
    if (!robloxInfo) {
      return interaction.reply({
        content: `❌ The Roblox username \`${robloxUsername}\` is invalid or does not exist.`,
        ephemeral: true
      });
    }

    // ✅ Check if username is already used
    const usernameTaken = await Whitelist.findOne({ where: { robloxId: robloxInfo.id } });
    if (usernameTaken) {
      return interaction.reply({
        content: `⚠️ The Roblox account \`${robloxUsername}\` has already been whitelisted.`,
        ephemeral: true
      });
    }

    const isValid = await isValidRobloxUsername(robloxUsername);

   if(!isValid) {
    return interaction.reply({ content: `❌ The Roblox username you provided is invalid or does not exist, Please try again with a correct username.`, ephemeral: true }) 
   }

    const entry = await Whitelist.findOne({ where: { key: inputKey } });

    if(!entry) {
     return interaction.reply({ content: `❌ This key is invalid or does not exist.`, ephemeral: true }) 
    }

    if(entry.discordId !== "N/A"|| entry.robloxUsername !== "N/A") {
      return interaction.reply({ content: `❌ This key has already been used before.`, ephemeral: true })
    }

    entry.discordId = userId;
    entry.robloxUsername = robloxUsername;
    entry.robloxId = robloxInfo.id;
    await entry.save();

    // ✅ Assign role based on whitelist type
const guild = interaction.guild;
const member = await guild.members.fetch(userId);

const standardRoleId = '1393240522281324614';
const premiumRoleId = '1393240594167496875';

const roleIdToGive = entry.whitelistType === 'Premium' ? premiumRoleId : standardRoleId;
const roleToGive = guild.roles.cache.get(roleIdToGive);

// ✅ Make sure the member doesn't already have the role
if (roleToGive && !member.roles.cache.has(roleToGive.id)) {
  try {
    await member.roles.add(roleToGive);
  } catch (error) {
    console.error(`❌ Failed to give role: ${error}`);
    await interaction.followUp({
      content: `⚠️ Whitelist successful, but I couldn't assign the role. Please contact a moderator.`,
      ephemeral: true
    });
  }
}

    const successEmbed = new EmbedBuilder()
    .setTitle(`✅ Whitelist Key Redeemed`)
    .addFields(
      { name: `Roblox Username`, value: `${robloxUsername}`},
       { name: 'Roblox ID', value: robloxInfo.id },
      { name: "Discord User", value: `<@${userId}>`},
      { name: "Whitelist Type", value: `${entry.whitelistType || "Standard"}`},
    )
    .setColor("Green")
    await interaction.reply({ embeds: [successEmbed] })

    // ✅ Logging to staff channel
const logChannelId = '1393256961780220134';
const logChannel = guild.channels.cache.get(logChannelId);

if (logChannel && logChannel.isTextBased()) {
  const logEmbed = new EmbedBuilder()
    .setTitle('📥 Whitelist Log: Redeem')
    .addFields(
      { name: 'Discord User', value: `<@${userId}> (${userId})`, inline: true },
      { name: 'Roblox Username', value: robloxUsername, inline: true },
      { name: 'Roblox ID', value: robloxInfo.id, inline: true },
      { name: 'Whitelist Type', value: entry.whitelistType || 'Standard', inline: true },
      { name: 'Key', value: `\`${inputKey}\`` }
    )
    .setTimestamp();

  try {
    await logChannel.send({ embeds: [logEmbed] });
  } catch (logErr) {
    console.error(`❌ Failed to send log to channel: ${logErr}`);
  }
}
  }
}