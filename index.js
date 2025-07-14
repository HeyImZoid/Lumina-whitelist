import { Client, IntentsBitField, Collection, ActivityType } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
const keep_alive = require('./keep_alive.js')

class DiscordClient {
client = new Client({
intents: [
IntentsBitField.Flags.Guilds,
IntentsBitField.Flags.GuildMessages,
IntentsBitField.Flags.MessageContent,
]
});

commands = new Collection();

constructor(token) {
if (!token) throw new Error("Missing DISCORD_TOKEN");
this.token = token;
}

async loadCommands() {
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandPath = path.join(__dirname, 'Commands');
const commandFiles = readdirSync(commandPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {  
  try {  
    const filePath = path.join(commandPath, file);  
    const module = await import(`file://${filePath}`);  
    const command = module.default || module;  
    if (command?.data?.name) {  
      this.commands.set(command.data.name, command);  
      console.log(`✅ Loaded command: ${command.data.name}`);  
    }  
  } catch (error) {  
    console.error(`❌ Failed to load command ${file}:`, error);  
  }  
}

}

async registerCommands() {
try {
const commands = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
await this.client.application?.commands.set(commands);
console.log(`✅ Registered ${commands.length} application commands`);
} catch (error) {
console.error('❌ Failed to register commands:', error);
}
}

async login() {
try {
await this.client.login(this.token);
await this.loadCommands();
await this.registerCommands();

this.client.user?.setPresence({  
    activities: [{ name: "Assisting Members!", type: ActivityType.Playing }],  
    status: 'online',  
  });  

  this.setHandlers();  
  console.log('🤖 Discord bot logged in successfully');  
} catch (error) {  
  console.error('❌ Failed to login:', error);  
  process.exit(1);  
}

}

setHandlers() {
this.client.on('interactionCreate', async interaction => {
if (!interaction.isCommand()) return;

const command = this.commands.get(interaction.commandName);  
  if (!command) return;  

  try {  
    await command.execute(interaction, this.client);  
  } catch (err) {  
    console.error(`❌ Error executing ${interaction.commandName}:`, err);  

    const errorMessage = { content: "❌ An error occurred while executing this command", ephemeral: true };  

    try {  
      if (interaction.replied || interaction.deferred) {  
        await interaction.followUp(errorMessage);  
      } else {  
        await interaction.reply(errorMessage);  
      }  
    } catch (error) {  
      console.error("❌ Failed to send error reply:", error);  
    }  
  }  
});

}
}

// === Start Services ===
new DiscordClient(process.env.TOKEN).login();

// index.js
import dotenv from 'dotenv';
import { Whitelist } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ POST - Add user to whitelist
app.post('/whitelist', async (req, res) => {
const { key, robloxUsername, discordId, whitelistType } = req.body;

if (!key || !robloxUsername || !discordId || !whitelistType) {
return res.status(400).json({ error: 'Missing required fields' });
}

if (!['Standard', 'Premium'].includes(whitelistType)) {
return res.status(400).json({ error: 'Invalid whitelist type' });
}

try {
const existing = await Whitelist.findOne({ where: { key } });
if (existing) {
return res.status(409).json({ error: 'Key already used' });
}

const entry = await Whitelist.create({ key, robloxUsername, discordId, whitelistType });  
res.json({ success: true, entry });

} catch (err) {
res.status(500).json({ error: 'Failed to create whitelist entry' });
}
});

// 🔍 GET /whitelist/:key
app.get('/whitelist/:key', async (req, res) => {
const entry = await Whitelist.findOne({ where: { key: req.params.key } });
if (!entry) return res.status(404).json({ valid: false });
res.json({ valid: true, entry });
});

app.listen(PORT, () => {
console.log(`🟢 Whitelist API running at http://localhost:${PORT}`);
});
