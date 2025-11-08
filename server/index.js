const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');
const express = require('express');
const { zonedTimeToUtc, utcToZonedTime, format } = require('date-fns-tz');
require('dotenv').config();

const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessageReactions, 
  ],
});

const API_URL = process.env.API_URL || 'https://sms-grade-9-homework-server.onrender.com';
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

// Slash Commands - Only /setup
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the homework tracker bot - creates a channel with buttons')
];

// Register slash commands
client.once('clientReady', async () => {
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
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'setup') {
      await handleSetup(interaction);
    }
  } else if (interaction.isButton()) {
    await handleButtonClick(interaction);
  } else if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction);
  }
});

async function handleSetup(interaction) {
  // Check if user has permission to manage channels
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Permission Denied')
      .setDescription('You need "Manage Channels" permission to set up the bot.')
      .setTimestamp();

    return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }

  // Defer the reply immediately to avoid timeout
  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if homework-tracker channel already exists
    const existingChannel = interaction.guild.channels.cache.find(
      channel => channel.name === 'homework-tracker' && channel.type === 0
    );

    if (existingChannel) {
      const existsEmbed = new EmbedBuilder()
        .setColor('#ffa500')
        .setTitle('⚠️ Channel Already Exists')
        .setDescription(`Homework tracker channel already exists: ${existingChannel}\n\nI will only create one channel to avoid duplicates.`)
        .setTimestamp();

      return await interaction.editReply({ embeds: [existsEmbed] });
    }

    // Create a new channel (only if it doesn't exist)
    const channel = await interaction.guild.channels.create({
      name: 'homework-tracker',
      type: 0, // Text channel
      topic: 'SMS Grade 9 Homework Tracker - Use buttons below to manage homework',
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.SendMessages],
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.EmbedLinks]
        }
      ]
    });

    // Create embed with instructions
    const setupEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 SMS Grade 9 Homework Tracker')
      .setDescription('Welcome to the Homework Tracker! Use the buttons below to manage your homework assignments.\n\n**Instructions:**\n• Click any button to open a form\n• Fill out the form and submit\n• All changes are saved immediately')
      .setTimestamp();

    // Create buttons for all commands
    const buttonRow1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('btn_add_homework')
          .setLabel('➕ Add Homework')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_remove_homework')
          .setLabel('➖ Remove Homework')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('btn_list_homework')
          .setLabel('📋 List Homework')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('btn_database')
          .setLabel('📊 Database')
          .setStyle(ButtonStyle.Secondary)
      );

    const buttonRow2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('btn_show_website')
          .setLabel('🌐 Website Status')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('btn_edit_homework')
          .setLabel('✏️ Edit Homework')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('btn_add_link')
          .setLabel('🔗 Add Study Link')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('btn_list_links')
          .setLabel('📋 List Study Links')
          .setStyle(ButtonStyle.Secondary)
      );

    const buttonRow3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('btn_delete_link')
          .setLabel('🗑️ Delete Study Link')
          .setStyle(ButtonStyle.Danger)
      );

    await channel.send({
      embeds: [setupEmbed],
      components: [buttonRow1, buttonRow2, buttonRow3]
    });

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Setup Complete')
      .setDescription(`Successfully created channel ${channel}!\n\nThe channel contains buttons for all homework management functions.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error setting up bot:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Setup Failed')
      .setDescription('Failed to create the channel. Please check bot permissions and try again.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleButtonClick(interaction) {
  const buttonId = interaction.customId;

  try {
    if (buttonId === 'btn_add_homework') {
      await showAddHomeworkModal(interaction);
    } else if (buttonId === 'btn_remove_homework') {
      await showRemoveHomeworkModal(interaction);
    } else if (buttonId === 'btn_list_homework') {
      await handleListHomework(interaction);
    } else if (buttonId === 'btn_database') {
      await handleDatabase(interaction);
    } else if (buttonId === 'btn_show_website') {
      await handleShowWebsite(interaction);
    } else if (buttonId === 'btn_edit_homework') {
      await showEditHomeworkModal(interaction);
    } else if (buttonId === 'btn_add_link') {
      await showAddLinkModal(interaction);
    } else if (buttonId === 'btn_list_links') {
      await handleListStudyLinks(interaction);
    } else if (buttonId === 'btn_delete_link') {
      await showDeleteLinkModal(interaction);
    }
  } catch (error) {
    console.error('Error handling button click:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Error')
      .setDescription('An error occurred. Please try again.')
      .setTimestamp();

    // Only reply if the interaction hasn't been acknowledged yet
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

async function handleModalSubmit(interaction) {
  const modalId = interaction.customId;

  try {
    if (modalId === 'modal_add_homework') {
      await handleAddHomeworkFromModal(interaction);
    } else if (modalId === 'modal_remove_homework') {
      await handleRemoveHomeworkFromModal(interaction);
    } else if (modalId === 'modal_edit_homework') {
      await handleEditHomeworkFromModal(interaction);
    } else if (modalId === 'modal_add_link') {
      await handleAddLinkFromModal(interaction);
    } else if (modalId === 'modal_delete_link') {
      await handleDeleteLinkFromModal(interaction);
    }
  } catch (error) {
    console.error('Error handling modal submit:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Error')
      .setDescription('An error occurred while processing your form. Please try again.')
      .setTimestamp();

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}

// Modal builders
async function showAddHomeworkModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_add_homework')
    .setTitle('Add Homework Assignment');

  const titleInput = new TextInputBuilder()
    .setCustomId('input_title')
    .setLabel('Title')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('e.g., Math Chapter 5 Exercises');

  const subjectInput = new TextInputBuilder()
    .setCustomId('input_subject')
    .setLabel('Subject')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('e.g., Mathematics');

  const dueDateInput = new TextInputBuilder()
    .setCustomId('input_due_date')
    .setLabel('Due Date (YYYY-MM-DD)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('2024-12-31');

  const dueTimeInput = new TextInputBuilder()
    .setCustomId('input_due_time')
    .setLabel('Due Time (HH:MM - 24h format)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder('23:59 (optional)');

  const descriptionInput = new TextInputBuilder()
    .setCustomId('input_description')
    .setLabel('Description (Optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Additional details about the homework...');

  const row1 = new ActionRowBuilder().addComponents(titleInput);
  const row2 = new ActionRowBuilder().addComponents(subjectInput);
  const row3 = new ActionRowBuilder().addComponents(dueDateInput);
  const row4 = new ActionRowBuilder().addComponents(dueTimeInput);
  const row5 = new ActionRowBuilder().addComponents(descriptionInput);

  modal.addComponents(row1, row2, row3, row4, row5);

  await interaction.showModal(modal);
}

async function showRemoveHomeworkModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_remove_homework')
    .setTitle('Remove Homework Assignment');

  const titleInput = new TextInputBuilder()
    .setCustomId('input_title')
    .setLabel('Homework Title to Remove')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('Enter the exact title of homework to remove');

  const row = new ActionRowBuilder().addComponents(titleInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function showEditHomeworkModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_edit_homework')
    .setTitle('Edit Homework Assignment');

  const homeworkIdInput = new TextInputBuilder()
    .setCustomId('input_homework_id')
    .setLabel('Homework ID')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('Enter the homework ID');

  const fieldInput = new TextInputBuilder()
    .setCustomId('input_field')
    .setLabel('Field (title/subject/desc/dueDate)') // ← SHORTENED
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('title, subject, description, dueDate');

  const newValueInput = new TextInputBuilder()
    .setCustomId('input_new_value')
    .setLabel('New Value')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder('Enter the new value');

  const row1 = new ActionRowBuilder().addComponents(homeworkIdInput);
  const row2 = new ActionRowBuilder().addComponents(fieldInput);
  const row3 = new ActionRowBuilder().addComponents(newValueInput);

  modal.addComponents(row1, row2, row3);

  await interaction.showModal(modal);
}

async function showAddLinkModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_add_link')
    .setTitle('Add Study Resource Link');

  const urlInput = new TextInputBuilder()
    .setCustomId('input_url')
    .setLabel('URL')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('https://example.com');

  const titleInput = new TextInputBuilder()
    .setCustomId('input_title')
    .setLabel('Title')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('Study Resource Title');

  const descriptionInput = new TextInputBuilder()
    .setCustomId('input_description')
    .setLabel('Description (Optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setPlaceholder('Description of the resource...');

  const row1 = new ActionRowBuilder().addComponents(urlInput);
  const row2 = new ActionRowBuilder().addComponents(titleInput);
  const row3 = new ActionRowBuilder().addComponents(descriptionInput);

  modal.addComponents(row1, row2, row3);

  await interaction.showModal(modal);
}

async function showDeleteLinkModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_delete_link')
    .setTitle('Delete Study Resource Link');

  const linkIdInput = new TextInputBuilder()
    .setCustomId('input_link_id')
    .setLabel('Link ID to Delete')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('Enter the link ID from the list above')
    .setMaxLength(100);

  const row = new ActionRowBuilder().addComponents(linkIdInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

// Modal handlers
async function handleAddHomeworkFromModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  if (!checkCooldown(interaction.user.id, 'addhomework')) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('⏰ Rate Limited')
      .setDescription('Please wait 30 seconds before using this again.')
      .setTimestamp();

    return await interaction.editReply({ embeds: [errorEmbed] });
  }

  const title = interaction.fields.getTextInputValue('input_title');
  const subject = interaction.fields.getTextInputValue('input_subject');
  const dueDate = interaction.fields.getTextInputValue('input_due_date');
  const dueTime = interaction.fields.getTextInputValue('input_due_time') || '23:59';
  const description = interaction.fields.getTextInputValue('input_description') || '';
  const creator = interaction.user.username;

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dueDate)) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid Date Format')
      .setDescription('Please use the format YYYY-MM-DD for the due date.')
      .setTimestamp();

    return await interaction.editReply({ embeds: [errorEmbed] });
  }

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(dueTime)) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid Time Format')
      .setDescription('Please use the format HH:MM for the due time (24-hour format).')
      .setTimestamp();

    return await interaction.editReply({ embeds: [errorEmbed] });
  }

  // Create due date with time in Winnipeg timezone
  const [hours, minutes] = dueTime.split(':').map(Number);
  const dueDateWinnipeg = new Date(dueDate);
  dueDateWinnipeg.setHours(hours, minutes, 0, 0);
  
  // Convert Winnipeg time to UTC for storage
  const dueDateUTC = zonedTimeToUtc(dueDateWinnipeg, WINNIPEG_TIMEZONE);
  
  // Validate that the date is not in the past
  const nowWinnipeg = utcToZonedTime(new Date(), WINNIPEG_TIMEZONE);
  const todayWinnipeg = new Date(nowWinnipeg);
  todayWinnipeg.setHours(0, 0, 0, 0);
  
  if (dueDateWinnipeg < todayWinnipeg) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid Date')
      .setDescription('Due date cannot be in the past.')
      .setTimestamp();

    return await interaction.editReply({ embeds: [errorEmbed] });
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
      .setTitle('✅ Homework Added Successfully')
      .setDescription(`**${homework.title}** has been added to your homework tracker.`)
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

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error adding homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Add Homework')
      .setDescription('Could not add homework to the tracker. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleRemoveHomeworkFromModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const title = interaction.fields.getTextInputValue('input_title');

  try {
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

      return await interaction.editReply({ embeds: [errorEmbed] });
    }

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

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error removing homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Remove Homework')
      .setDescription('Could not remove homework from the tracker. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleEditHomeworkFromModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // Remove the admin permission check to make it accessible to more users
  // if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
  //   const errorEmbed = new EmbedBuilder()
  //     .setColor('#ff0000')
  //     .setTitle('❌ Permission Denied')
  //     .setDescription('You need administrator permissions to edit homework assignments.')
  //     .setTimestamp();
  //   return await interaction.editReply({ embeds: [errorEmbed] });
  // }

  const homeworkId = interaction.fields.getTextInputValue('input_homework_id');
  const field = interaction.fields.getTextInputValue('input_field').toLowerCase();
  const newValue = interaction.fields.getTextInputValue('input_new_value');

  // Validate field input
  const allowedFields = ['title', 'subject', 'description', 'duedate'];
  if (!allowedFields.includes(field)) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid Field')
      .setDescription('Field must be one of: title, subject, description, or dueDate')
      .setTimestamp();
    return await interaction.editReply({ embeds: [errorEmbed] });
  }

  try {
    // First, get all homework to find the correct one
    const response = await axios.get(`${API_URL}/api/homework`);
    const homeworkList = response.data;
    const homework = homeworkList.find(hw => hw._id === homeworkId);

    if (!homework) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Homework Not Found')
        .setDescription(`No homework found with ID "${homeworkId}".\n\n**Tip:** Use "/list homework" to see all assignments with their IDs.`)
        .setTimestamp();
      return await interaction.editReply({ embeds: [errorEmbed] });
    }

    let updateData = {};
    
    // Handle different field types
    if (field === 'duedate') {
      // Validate and parse date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(newValue)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Invalid Date Format')
          .setDescription('Please use the format YYYY-MM-DD for the due date.')
          .setTimestamp();
        return await interaction.editReply({ embeds: [errorEmbed] });
      }
      
      // Create date with current time in Winnipeg timezone, then convert to UTC
      const dueDateWinnipeg = new Date(newValue);
      const nowWinnipeg = utcToZonedTime(new Date(), WINNIPEG_TIMEZONE);
      dueDateWinnipeg.setHours(nowWinnipeg.getHours(), nowWinnipeg.getMinutes(), 0, 0);
      updateData.dueDate = zonedTimeToUtc(dueDateWinnipeg, WINNIPEG_TIMEZONE).toISOString();
    } else {
      updateData[field] = newValue;
    }

    await axios.put(`${API_URL}/api/homework/${homeworkId}`, updateData);

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Homework Updated Successfully')
      .setDescription(`**${homework.title}** has been updated.`)
      .addFields(
        { name: '📝 Field Updated', value: field, inline: true },
        { name: '🆕 New Value', value: newValue.length > 50 ? newValue.substring(0, 50) + '...' : newValue, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error editing homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Edit Homework')
      .setDescription('Could not update the homework assignment. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleAddLinkFromModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  if (!checkCooldown(interaction.user.id, 'link')) {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('⏰ Rate Limited')
      .setDescription('Please wait 30 seconds before using this again.')
      .setTimestamp();

    return await interaction.editReply({ embeds: [errorEmbed] });
  }

  const url = interaction.fields.getTextInputValue('input_url');
  const title = interaction.fields.getTextInputValue('input_title');
  const description = interaction.fields.getTextInputValue('input_description') || '';
  const addedBy = interaction.user.username;

  // Validate URL format
  try {
    new URL(url);
  } catch {
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Invalid URL')
      .setDescription('Please provide a valid URL.')
      .setTimestamp();

    return await interaction.editReply({ embeds: [errorEmbed] });
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

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error adding study link:', error);
    
    let errorMessage = 'Could not add the study link. Please try again later.';
    
    if (error.response?.data?.error?.includes('duplicate key')) {
      errorMessage = 'This study link already exists in the database.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid data provided. Please check your inputs.';
    }
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Add Study Link')
      .setDescription(errorMessage)
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleDeleteLinkFromModal(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const linkId = interaction.fields.getTextInputValue('input_link_id');

  try {
    const response = await axios.delete(`${API_URL}/api/study-links/${linkId}`);
    const deletedLink = response.data.studyLink;

    const successEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Study Link Deleted Successfully')
      .setDescription(`**${deletedLink.title}** has been removed from the study resources.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error deleting study link:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Delete Study Link')
      .setDescription('Could not delete the study link. Please check the ID and try again.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleListStudyLinks(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const response = await axios.get(`${API_URL}/api/study-links`);
    const studyLinks = response.data;

    if (studyLinks.length === 0) {
      const noLinksEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('🔗 No Study Links Found')
        .setDescription('There are no study links in the database.')
        .setTimestamp();
      return await interaction.editReply({ embeds: [noLinksEmbed] });
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🔗 Study Resource Links')
      .setDescription(`Showing ${studyLinks.length} link${studyLinks.length !== 1 ? 's' : ''}\n**Use the ID to delete links**`)
      .setTimestamp();

    studyLinks.forEach((link) => {
      embed.addFields({
        name: `📎 ${link.title} (ID: ${link._id})`,
        value: `**URL:** [Click Here](${link.url})\n**Description:** ${link.description || 'No description'}\n**Added by:** ${link.addedBy}`,
        inline: false
      });
    });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error listing study links:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to List Study Links')
      .setDescription('Could not retrieve study links. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Original handler functions (for non-modal commands)
async function handleListHomework(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const response = await axios.get(`${API_URL}/api/homework`);
    let homeworkList = response.data;

    if (homeworkList.length === 0) {
      const noHomeworkEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('📚 No Homework Found')
        .setDescription('You have no homework assignments.')
        .setTimestamp();

      return await interaction.editReply({ embeds: [noHomeworkEmbed] });
    }

    homeworkList.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📚 Your SMS Grade 9 Homework Assignments')
      .setDescription(`Showing ${homeworkList.length} assignment${homeworkList.length !== 1 ? 's' : ''}\n**Use the ID to edit homework**`)
      .setTimestamp();

    const itemsToShow = homeworkList.slice(0, 10); // Reduced to 10 for better readability
    
    itemsToShow.forEach((homework) => {
      const dueDateUTC = new Date(homework.dueDate);
      const dueDateWinnipeg = utcToZonedTime(dueDateUTC, WINNIPEG_TIMEZONE);
      const nowWinnipeg = utcToZonedTime(new Date(), WINNIPEG_TIMEZONE);
      const isOverdue = dueDateWinnipeg < nowWinnipeg && homework.status === 'Not Done';
      
      const statusEmoji = homework.status === 'Done' ? '✅' : (isOverdue ? '🔴' : '⏰');
      const dueDateStr = format(dueDateWinnipeg, 'MMM do, yyyy \'at\' h:mm a', { timeZone: WINNIPEG_TIMEZONE });
      
      embed.addFields({
        name: `${statusEmoji} ${homework.title} (ID: ${homework._id})`,
        value: `**Subject:** ${homework.subject}\n**Due:** ${dueDateStr}\n**Status:** ${homework.status}`,
        inline: false
      });
    });

    if (homeworkList.length > 10) {
      embed.setFooter({ text: `Showing first 10 of ${homeworkList.length} assignments` });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error listing homework:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to List Homework')
      .setDescription('Could not retrieve homework list. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleDatabase(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const response = await axios.get(`${API_URL}/api/homework`);
    const homeworkList = response.data;

    if (homeworkList.length === 0) {
      const noHomeworkEmbed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('📊 Database - No Homework Found')
        .setDescription('There are no homework assignments in the database.')
        .setTimestamp();

      return await interaction.editReply({ embeds: [noHomeworkEmbed] });
    }

    const userStats = new Map();
    
    homeworkList.forEach(homework => {
      const completedUsers = homework.completedBy.map(completion => completion.username);
      
      completedUsers.forEach(username => {
        if (!userStats.has(username)) {
          userStats.set(username, { completed: 0, total: 0 });
        }
        userStats.get(username).completed++;
      });
    });

    const totalHomework = homeworkList.length;
    
    userStats.forEach((stats) => {
      stats.total = totalHomework;
    });

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
      const sortedUsers = Array.from(userStats.entries()).sort((a, b) => {
        const aRate = a[1].completed / a[1].total;
        const bRate = b[1].completed / b[1].total;
        return bRate - aRate;
      });

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

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error fetching database:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Failed to Load Database')
      .setDescription('Could not retrieve user completion data. Please try again later.')
      .setTimestamp();

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleShowWebsite(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
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

    const dbUp = !!(health && health.db && health.db.up);

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
    await interaction.editReply({ embeds: [errorEmbed] });
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

// Add a simple HTTP server for Render port binding
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.json({ 
    status: 'Discord Bot Running', 
    bot: client.user?.tag || 'Starting...',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Discord bot HTTP server running on port ${PORT} (for Render port binding)`);
});
