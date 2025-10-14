const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const express = require('express');
const { zonedTimeToUtc, utcToZonedTime, format } = require('date-fns-tz');
require('dotenv').config();

const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const API_URL = process.env.API_URL || 'http://localhost:5000';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://sms-grade-9-homework.onrender.com';
const WINNIPEG_TIMEZONE = 'America/Winnipeg';

// Simple rate limiting for Discord commands
const userCooldowns = new Map();
const COOLDOWN_TIME = 30000; // 30 seconds

function checkCooldown(userId, command) {
  const key = `${userId}-${command}`;
  const now = Date.now();
  
  if (userCooldowns.has(key)) {
    const lastUsed = userCooldowns.get(key);
    if (now - lastUsed < COOLDOWN_TIME) {
      return false; // Still in cooldown
    }
  }
  
  userCooldowns.set(key, now);
  return true; // Not in cooldown
}

// Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('addhomework')
    .setDescription('Add a new SMS Grade 9 homework assignment')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('The title of the homework')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('subject')
        .setDescription('The subject or class name')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duedate')
        .setDescription('Due date in YYYY-MM-DD format')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('duetime')
        .setDescription('Due time in HH:MM format (24-hour, Winnipeg time)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Optional description of the homework')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('creator')
        .setDescription('Your name (creator of this homework)')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('removehomework')
    .setDescription('Remove a SMS Grade 9 homework assignment')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('The title of the homework to remove')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('listhomework')
    .setDescription('List all SMS Grade 9 homework assignments')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Done', value: 'Done' },
          { name: 'Not Done', value: 'Not Done' }
        )
    ),

  new SlashCommandBuilder()
    .setName('database')
    .setDescription('View completion status for all users'),

  new SlashCommandBuilder()
    .setName('showwebsite')
    .setDescription('Show website/API/DB status with overall rating'),

  new SlashCommandBuilder()
    .setName('editprompt')
    .setDescription('Edit an existing homework assignment (Admin only)')
    .addStringOption(option =>
      option
        .setName('homework_id')
        .setDescription('The ID of the homework to edit')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('field')
        .setDescription('The field to edit')
        .setRequired(true)
        .addChoices(
          { name: 'Title', value: 'title' },
          { name: 'Subject', value: 'subject' },
          { name: 'Description', value: 'description' },
          { name: 'Due Date', value: 'dueDate' }
        )
    )
    .addStringOption(option =>
      option
        .setName('new_value')
        .setDescription('The new value for the field')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Add a study resource link')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('The URL of the study resource')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('Title for the study resource')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('description')
        .setDescription('Optional description of the resource')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('deletelink')
    .setDescription('Delete a study resource link')
    .addStringOption(option =>
      option
        .setName('link_id')
        .setDescription('The ID of the link to delete')
        .setRequired(true)
    )
];

// Register slash commands
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  try {
    console.log('Started refreshing application (/) commands.');
    await client.application.commands.set(commands);
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error refreshing application commands:', error);
  }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === 'addhomework') {
      await handleAddHomework(interaction);
    } else if (commandName === 'removehomework') {
      await handleRemoveHomework(interaction);
    } else if (commandName === 'listhomework') {
      await handleListHomework(interaction);
    } else if (commandName === 'database') {
      await handleDatabase(interaction);
    } else if (commandName === 'showwebsite') {
      await handleShowWebsite(interaction);
    } else if (commandName === 'editprompt') {
      await handleEditPrompt(interaction);
    } else if (commandName === 'link') {
      await handleLink(interaction);
    } else if (commandName === 'deletelink') {
      await handleDeleteLink(interaction);
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Error')
      .setDescription('An error occurred while processing your request. Please try again later.')
      .setTimestamp();

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
});

async function handleAddHomework(interaction) {
  // Check rate limiting
  if (!checkCooldown(interaction.user.id, 'addhomework')) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('⏰ Rate Limited')
      .setDescription('Please wait 30 seconds before using this command again.')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  const title = interaction.options.getString('title');
  const subject = interaction.options.getString('subject');
  const dueDate = interaction.options.getString('duedate');
  const dueTime = interaction.options.getString('duetime') || '23:59'; // Default to end of day
  const description = interaction.options.getString('description') || '';
  const creator = interaction.options.getString('creator');

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dueDate)) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid Date Format')
      .setDescription('Please use the format YYYY-MM-DD for the due date.')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(dueTime)) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid Time Format')
      .setDescription('Please use the format HH:MM for the due time (24-hour format).')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  // Create due date with time in Winnipeg timezone
  const [hours, minutes] = dueTime.split(':').map(Number);
  const dueDateWinnipeg = new Date(dueDate);
  dueDateWinnipeg.setHours(hours, minutes, 0, 0);
  
  // Convert Winnipeg time to UTC for storage
  const dueDateUTC = zonedTimeToUtc(dueDateWinnipeg, WINNIPEG_TIMEZONE);
  
  // Validate that the date is not in the past (using Winnipeg time)
  const nowWinnipeg = utcToZonedTime(new Date(), WINNIPEG_TIMEZONE);
  const todayWinnipeg = new Date(nowWinnipeg);
  todayWinnipeg.setHours(0, 0, 0, 0);
  
  if (dueDateWinnipeg < todayWinnipeg) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid Date')
      .setDescription('Due date cannot be in the past.')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  try {
    const response = await axios.post(`${API_URL}/api/homework`, {
      title,
      subject,
      dueDate: dueDateUTC.toISOString(),
      description,
      creator
    });

    const homework = response.data;
    const dueDateFormatted = format(dueDateWinnipeg, 'EEEE, MMMM do, yyyy \'at\' h:mm a', { timeZone: WINNIPEG_TIMEZONE });

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ SMS Grade 9 Homework Added Successfully')
      .setDescription(`**${homework.title}** has been added to your SMS Grade 9 homework tracker.`)
      .addFields(
        { name: '📚 Subject', value: homework.subject, inline: true },
        { name: '📅 Due Date', value: dueDateFormatted, inline: true },
        { name: '👤 Creator', value: homework.creator, inline: true },
        { name: '📝 Status', value: homework.status, inline: true }
      )
      .setTimestamp();

    if (description) {
      successEmbed.addFields({ name: '📄 Description', value: description, inline: false });
    }

    await interaction.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error adding homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Add Homework')
      .setDescription('Could not add homework to the tracker. Please try again later.')
      .setTimestamp();

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleRemoveHomework(interaction) {
  const title = interaction.options.getString('title');

  try {
    // First, get all homework to find the one with matching title
    const response = await axios.get(`${API_URL}/api/homework`);
    const homeworkList = response.data;
    
    const homeworkToRemove = homeworkList.find(hw => 
      hw.title.toLowerCase() === title.toLowerCase()
    );

    if (!homeworkToRemove) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Homework Not Found')
        .setDescription(`No homework found with the title "${title}".`)
        .setTimestamp();

      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Delete the homework
    await axios.delete(`${API_URL}/api/homework/${homeworkToRemove._id}`);

    const dueDateWinnipeg = utcToZonedTime(new Date(homeworkToRemove.dueDate), WINNIPEG_TIMEZONE);
    const dueDateStr = format(dueDateWinnipeg, 'MMM do, yyyy \'at\' h:mm a', { timeZone: WINNIPEG_TIMEZONE });

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Homework Removed Successfully')
      .setDescription(`**${homeworkToRemove.title}** has been removed from your homework tracker.`)
      .addFields(
        { name: '📚 Subject', value: homeworkToRemove.subject, inline: true },
        { name: '📅 Due Date', value: dueDateStr, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error removing homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Remove Homework')
      .setDescription('Could not remove homework from the tracker. Please try again later.')
      .setTimestamp();

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleListHomework(interaction) {
  const statusFilter = interaction.options.getString('status') || 'all';

  try {
    const response = await axios.get(`${API_URL}/api/homework`);
    let homeworkList = response.data;

    // Filter by status if specified
    if (statusFilter !== 'all') {
      homeworkList = homeworkList.filter(hw => hw.status === statusFilter);
    }

    if (homeworkList.length === 0) {
      const noHomeworkEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('📚 No Homework Found')
        .setDescription(statusFilter === 'all' 
          ? 'You have no homework assignments.' 
          : `No homework found with status "${statusFilter}".`)
        .setTimestamp();

      return await interaction.reply({ embeds: [noHomeworkEmbed] });
    }

    // Sort by due date
    homeworkList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Your SMS Grade 9 Homework Assignments')
      .setDescription(`Showing ${homeworkList.length} assignment${homeworkList.length !== 1 ? 's' : ''}`)
      .setTimestamp();

    // Add homework items (Discord embed field limit is 25, so we'll limit to 20)
    const itemsToShow = homeworkList.slice(0, 20);
    
    itemsToShow.forEach((homework, index) => {
      const dueDateUTC = new Date(homework.dueDate);
      const dueDateWinnipeg = utcToZonedTime(dueDateUTC, WINNIPEG_TIMEZONE);
      const nowWinnipeg = utcToZonedTime(new Date(), WINNIPEG_TIMEZONE);
      const isOverdue = dueDateWinnipeg < nowWinnipeg && homework.status === 'Not Done';
      
      const statusEmoji = homework.status === 'Done' ? '✅' : (isOverdue ? '🔴' : '⏰');
      const dueDateStr = format(dueDateWinnipeg, 'MMM do, yyyy \'at\' h:mm a', { timeZone: WINNIPEG_TIMEZONE });
      
      embed.addFields({
        name: `${statusEmoji} ${homework.title}`,
        value: `**Subject:** ${homework.subject}\n**Due:** ${dueDateStr}\n**Status:** ${homework.status}`,
        inline: true
      });
    });

    if (homeworkList.length > 20) {
      embed.setFooter({ text: `Showing first 20 of ${homeworkList.length} assignments` });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error listing homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to List Homework')
      .setDescription('Could not retrieve homework list. Please try again later.')
      .setTimestamp();

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleDatabase(interaction) {
  try {
    const response = await axios.get(`${API_URL}/api/homework`);
    const homeworkList = response.data;

    if (homeworkList.length === 0) {
      const noHomeworkEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('📊 Database - No Homework Found')
        .setDescription('There are no homework assignments in the database.')
        .setTimestamp();

      return await interaction.reply({ embeds: [noHomeworkEmbed] });
    }

    // Collect all unique usernames and their completion status
    const userStats = new Map();
    
    homeworkList.forEach(homework => {
      // Get all users who have completed this homework
      const completedUsers = homework.completedBy.map(completion => completion.username);
      
      // Add all users who have completed any homework to our stats
      completedUsers.forEach(username => {
        if (!userStats.has(username)) {
          userStats.set(username, { completed: 0, total: 0 });
        }
        userStats.get(username).completed++;
      });
      
      // Count total homework for each user (everyone has access to all homework)
      // We'll track this by counting total homework assignments
    });

    // Calculate total homework count
    const totalHomework = homeworkList.length;
    
    // Update total for all users who have completed at least one homework
    userStats.forEach((stats, username) => {
      stats.total = totalHomework;
    });

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📊 SMS Grade 9 Homework Database')
      .setDescription(`Completion status for all users (${totalHomework} total assignments)`)
      .setTimestamp();

    if (userStats.size === 0) {
      embed.addFields({
        name: '📝 Status',
        value: 'No users have completed any homework yet.',
        inline: false
      });
    } else {
      // Sort users by completion rate (descending)
      const sortedUsers = Array.from(userStats.entries()).sort((a, b) => {
        const aRate = a[1].completed / a[1].total;
        const bRate = b[1].completed / b[1].total;
        return bRate - aRate;
      });

      // Add user statistics (Discord embed field limit is 25, so we'll limit to 20 users)
      const usersToShow = sortedUsers.slice(0, 20);
      
      usersToShow.forEach(([username, stats]) => {
        const completionRate = ((stats.completed / stats.total) * 100).toFixed(1);
        const statusEmoji = stats.completed === stats.total ? '🏆' : 
                           stats.completed > stats.total * 0.5 ? '🔥' : 
                           stats.completed > 0 ? '📚' : '⏰';
        
        embed.addFields({
          name: `${statusEmoji} ${username}`,
          value: `**Completed:** ${stats.completed}/${stats.total} (${completionRate}%)`,
          inline: true
        });
      });

      if (userStats.size > 20) {
        embed.setFooter({ text: `Showing top 20 of ${userStats.size} users` });
      }
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error fetching database:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Load Database')
      .setDescription('Could not retrieve user completion data. Please try again later.')
      .setTimestamp();

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleShowWebsite(interaction) {
  try {
    await interaction.deferReply();

    // Measure API health
    let apiUp = false;
    let apiLatencyMs = null;
    let health = null;
    const apiStart = Date.now();
    try {
      const res = await axios.get(`${API_URL}/health`, { timeout: 8000 });
      apiLatencyMs = Date.now() - apiStart;
      apiUp = res.status === 200 && res.data && res.data.status === 'OK';
      health = res.data || null;
    } catch (e) {
      apiLatencyMs = Date.now() - apiStart;
      apiUp = false;
    }

    // Measure Website reachability
    let siteUp = false;
    let siteLatencyMs = null;
    const siteStart = Date.now();
    try {
      const res = await axios.get(WEBSITE_URL, { timeout: 8000 });
      siteLatencyMs = Date.now() - siteStart;
      siteUp = res.status >= 200 && res.status < 400;
    } catch (e) {
      siteLatencyMs = Date.now() - siteStart;
      siteUp = false;
    }

    // DB status comes from health if available
    const dbUp = !!(health && health.db && health.db.up);

    // Build overall rating
    // Up: all up
    // Moderate: API up but either website or DB down, or high latency (>1200ms)
    // Down: API down
    let overall = 'Up';
    if (!apiUp) {
      overall = 'Down';
    } else if (!siteUp || !dbUp || (apiLatencyMs !== null && apiLatencyMs > 1200)) {
      overall = 'Moderate';
    }

    const color = overall === 'Up' ? 0x00ff00 : overall === 'Moderate' ? 0xffa500 : 0xff0000;
    const statusEmoji = overall === 'Up' ? '🟢' : overall === 'Moderate' ? '🟠' : '🔴';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${statusEmoji} Website Status`)
      .setDescription('Current status of Website, API, and Database')
      .addFields(
        {
          name: '🌐 Website',
          value: `URL: ${WEBSITE_URL}\nStatus: ${siteUp ? 'Up ✅' : 'Down ❌'}${siteLatencyMs !== null ? `\nLatency: ${siteLatencyMs} ms` : ''}`,
          inline: false
        },
        {
          name: '🧠 API',
          value: `URL: ${API_URL}\nStatus: ${apiUp ? 'Up ✅' : 'Down ❌'}${apiLatencyMs !== null ? `\nLatency: ${apiLatencyMs} ms` : ''}`,
          inline: false
        },
        {
          name: '🗄️ Database',
          value: `Status: ${dbUp ? 'Up ✅' : 'Down ❌'}`,
          inline: false
        }
      )
      .setFooter({ text: `Overall: ${overall}` })
      .setTimestamp();

    if (health && health.metrics) {
      embed.addFields({
        name: '📈 Metrics',
        value: `Total: ${health.metrics.totalHomework}\nUpcoming: ${health.metrics.upcomingCount}\nOverdue: ${health.metrics.overdueCount}`,
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error building status:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to fetch website status')
      .setDescription('Please try again later.')
      .setTimestamp();
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

async function handleEditPrompt(interaction) {
  // Check if user has admin permissions
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Permission Denied')
      .setDescription('You need administrator permissions to edit homework assignments.')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  const homeworkId = interaction.options.getString('homework_id');
  const field = interaction.options.getString('field');
  const newValue = interaction.options.getString('new_value');

  try {
    // First, get the homework to verify it exists
    const response = await axios.get(`${API_URL}/api/homework`);
    const homeworkList = response.data;
    const homework = homeworkList.find(hw => hw._id === homeworkId);

    if (!homework) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Homework Not Found')
        .setDescription(`No homework found with ID "${homeworkId}".`)
        .setTimestamp();

      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Prepare update data
    let updateData = {};
    if (field === 'dueDate') {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newValue)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Invalid Date Format')
          .setDescription('Please use the format YYYY-MM-DD for the due date.')
          .setTimestamp();

        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      updateData.dueDate = new Date(newValue).toISOString();
    } else {
      updateData[field] = newValue;
    }

    // Update the homework
    await axios.put(`${API_URL}/api/homework/${homeworkId}`, updateData);

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Homework Updated Successfully')
      .setDescription(`**${homework.title}** has been updated.`)
      .addFields(
        { name: '📝 Field Updated', value: field, inline: true },
        { name: '🆕 New Value', value: newValue, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error editing homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Edit Homework')
      .setDescription('Could not update the homework assignment. Please try again later.')
      .setTimestamp();

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleLink(interaction) {
  // Check rate limiting
  if (!checkCooldown(interaction.user.id, 'link')) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('⏰ Rate Limited')
      .setDescription('Please wait 30 seconds before using this command again.')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  const url = interaction.options.getString('url');
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description') || '';
  const addedBy = interaction.user.username;

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid URL')
      .setDescription('Please provide a valid URL.')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  try {
    const response = await axios.post(`${API_URL}/api/study-links`, {
      url,
      title,
      description,
      addedBy
    });

    const studyLink = response.data;

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Study Link Added Successfully')
      .setDescription(`**${studyLink.title}** has been added to the study resources.`)
      .addFields(
        { name: '🔗 URL', value: `[${studyLink.title}](${studyLink.url})`, inline: false },
        { name: '👤 Added By', value: studyLink.addedBy, inline: true }
      )
      .setTimestamp();

    if (description) {
      successEmbed.addFields({ name: '📄 Description', value: description, inline: false });
    }

    await interaction.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error adding study link:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Add Study Link')
      .setDescription('Could not add the study link. Please try again later.')
      .setTimestamp();

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

async function handleDeleteLink(interaction) {
  const linkId = interaction.options.getString('link_id');

  try {
    const response = await axios.delete(`${API_URL}/api/study-links/${linkId}`);
    const deletedLink = response.data.studyLink;

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Study Link Deleted Successfully')
      .setDescription(`**${deletedLink.title}** has been removed from the study resources.`)
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error deleting study link:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Delete Study Link')
      .setDescription('Could not delete the study link. Please check the ID and try again.')
      .setTimestamp();

    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
}

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Add a dummy port for Render (Discord bots don't need ports)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT} (Discord bot doesn't use this port)`);
});
