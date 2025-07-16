require('dotenv').config();
const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
import http from 'http';
import https from 'https';

const port = process.env.PORT || 5000;

http.createServer((req, res) => {
  console.log(`[KEEPALIVE] Ping received at ${new Date().toISOString()}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running!');
}).listen(port, () => {
  console.log(`[KEEPALIVE] Server running on port ${port}`);
});

setInterval(() => {
  https.get(process.env.RENDER_URL, (res) => {
    console.log(`[SELF-PING] Status: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[SELF-PING] Error: ${err.message}`);
  });
}, 2 * 60 * 1000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel],
});

const whitelistFile = 'whitelist.json';
let whitelist = fs.existsSync(whitelistFile)
  ? JSON.parse(fs.readFileSync(whitelistFile))
  : {};

async function saveAndUpload() {
  fs.writeFileSync(whitelistFile, JSON.stringify(whitelist, null, 2));
  const content = Buffer.from(JSON.stringify(whitelist, null, 2)).toString('base64');

  const { GITHUB_REPO, GITHUB_TOKEN, GITHUB_BRANCH } = process.env;
  const headers = { Authorization: `token ${GITHUB_TOKEN}` };
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/whitelist.json`;

  let sha;
  try {
    const res = await axios.get(url, { headers });
    sha = res.data.sha;
  } catch (err) {
    // File doesn't exist yet, no SHA needed
  }

  await axios.put(
    url,
    {
      message: 'Update whitelist.json',
      content,
      sha,
      branch: GITHUB_BRANCH,
    },
    { headers }
  );
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('whitelist')
      .setDescription('Assign or update your Roblox account')
      .addStringOption((opt) =>
        opt.setName('username').setDescription('Roblox username').setRequired(true)
      ),
    new SlashCommandBuilder().setName('check').setDescription('Check your linked Roblox account'),
    new SlashCommandBuilder()
      .setName('blacklist')
      .setDescription('Remove a Roblox user from the whitelist (Staff only)')
      .addStringOption((opt) =>
        opt.setName('username').setDescription('Roblox username').setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('list')
      .setDescription('List all Roblox and Discord pairs (Staff only)'),
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), {
    body: commands,
  });

  console.log('Commands registered.');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member, user, guild } = interaction;
  const discordId = user.id;
  const discordTag = `${user.username}#${user.discriminator}`;
  const roles = member.roles.cache;
  const isStaff = roles.some((r) => r.name === 'Moderators');
  const isStandardOrPremium = roles.some(
    (r) => r.name === 'Standard' || r.name === 'Premium'
  );

  if (
    ['whitelist', 'check'].includes(commandName) &&
    !isStandardOrPremium
  ) {
    return interaction.reply({
      content: 'You need the Standard or Premium role to use this command.',
      flags: 1 << 6,
    });
  }

  if (['blacklist', 'list'].includes(commandName) && !isStaff) {
    return interaction.reply({
      content: 'This command is for Staff only.',
      flags: 1 << 6,
    });
  }

  if (commandName === 'whitelist') {
    const roblox = options.getString('username').trim();

    // Remove existing link to this Discord user
    for (const key in whitelist) {
      if (whitelist[key].discordID === discordId) {
        delete whitelist[key];
      }
    }

    whitelist[roblox] = {
      discordID: discordId,
      discordTag: discordTag
    };

    await saveAndUpload();
    await interaction.reply(`You are now whitelisted as **${roblox}**`);
  }

  if (commandName === 'check') {
    const entry = Object.entries(whitelist).find(
      ([, data]) => data.discordID === discordId
    );
    if (entry) {
      await interaction.reply(`You are linked to **${entry[0]}**`);
    } else {
      await interaction.reply({
        content: 'You are not whitelisted yet.',
        flags: 1 << 6,
      });
    }
  }

  if (commandName === 'blacklist') {
    const roblox = options.getString('username').trim();
    const entry = whitelist[roblox];
    if (!entry) {
      return interaction.reply('This user is not whitelisted.');
    }

    const linkedDiscordId = entry.discordID;
    delete whitelist[roblox];
    await saveAndUpload();

    try {
      const memberToModify = await guild.members.fetch(linkedDiscordId);
      const standardRole = guild.roles.cache.find(r => r.name === 'Standard');
      const premiumRole = guild.roles.cache.find(r => r.name === 'Premium');

      if (memberToModify) {
        if (standardRole && memberToModify.roles.cache.has(standardRole.id)) {
          await memberToModify.roles.remove(standardRole);
        }
        if (premiumRole && memberToModify.roles.cache.has(premiumRole.id)) {
          await memberToModify.roles.remove(premiumRole);
        }
      }
    } catch (error) {
      console.error('Error removing roles:', error);
    }

    await interaction.reply(`Removed **${roblox}** from the whitelist and removed roles from linked user.`);
  }

  if (commandName === 'list') {
    if (Object.keys(whitelist).length === 0) {
      return interaction.reply({
        content: 'No whitelisted users.',
        flags: 1 << 6,
      });
    }

    const out = Object.entries(whitelist)
      .map(([robloxUser, info]) => `**${robloxUser}** - ${info.discordTag} (<@${info.discordID}>)`)
      .join('\n');

    await interaction.reply({ content: `Whitelisted Users:\n${out}`, flags: 1 << 6 });
  }
});

client.login(process.env.TOKEN);