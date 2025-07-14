const { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, Client } = require("discord.js");

module.exports = {
data: new SlashCommandBuilder()
.setName("commands")
.setDescription("Shows Lumina whitelist commands")
  .setDMPermission(false),
/**
*

@param {ChatInputCommandInteraction} interaction

@param {Client} client
*/
async execute(interaction, client) { // Add async here


// Await the fetch call to get the commands  
const commands = await client.application.commands.fetch();  
const helpCommand = commands.find(cmd => cmd.name === "commands");  
const helpCommand1 = `${helpCommand ? helpCommand.id : `N/A`}`  
  const disCheckCommand = commands.find(cmd => cmd.name === "dis-check")
  const disCheckCommand1 = `${disCheckCommand ? disCheckCommand.id : `N/A`}`
  const bloxCheckCommand = commands.find(cmd => cmd.name === "blox-check")
  const bloxCheckCommand1 = `${bloxCheckCommand ? bloxCheckCommand.id : `N/A`}`
  const claimCommand = commands.find(cmd => cmd.name === "claim")
  const claimCommand1 = `${claimCommand ? claimCommand.id : `N/A`}`
  const reportCommand = commands.find(cmd => cmd.name === "report-user")
  const reportCommand1 = `${reportCommand ? reportCommand.id : `N/A`}`
  
const reply = `<:Reply:1193833272065675364>`  

const embed = new EmbedBuilder()  
  .setTitle("Lumina Management Commands")  
  .setDescription(`</commands:${helpCommand1}> - Shows all of Lumina's whitelist commands.\n</dis-check:${disCheckCommand1}> - Profile lookup via discord.\n</blox-check:${bloxCheckCommand1}> - Profile lookup via roblox username.\n</claim:${claimCommand1}> - Claim monthly giveaway keys. (YOUTUBERS ONLY)\n</report-user:${reportCommand1}> - Report a whitelisted user for suspicious activity or breaking the terms of service, Or other reasons.`)
  .setColor("Random")  
await interaction.reply({ embeds: [embed] });  
  
        
      }  
    }