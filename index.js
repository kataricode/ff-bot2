let randomRunning = false;
let randomUserId = null;
let randomUserTag = null;
let randomStop = false;
let randomMessage = null;
let randomsRunning = false;
let randomsUserId = null;
let randomsStop = false;
let randomsMessage = null;

import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

import schedule from "node-schedule";

import fs from "fs";

import path from "path";

import axios from "axios";

import express from "express";

dotenv.config();

process.env.TZ = "Asia/Ho_Chi_Minh"; // 🕒 Ép múi giờ Việt Nam

const TOKEN = process.env.TOKEN;

const PREFIX = "!";

const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMessages,

    GatewayIntentBits.MessageContent,

  ],

});

client.once("ready", () => {

  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);

});

  // ======= LỆNH INFO =======
if (command === "info") {

  // ID kênh được phép sử dụng lệnh info
  const allowedInfoChannel = "1450083732211109928";

  // Kiểm tra xem có đúng kênh cho phép không
  if (msg.channel.id !== allowedInfoChannel) {
    const channelWarn = await msg.reply(
      `❌ Lệnh này chỉ được dùng tại kênh: <#${allowedInfoChannel}>!`
    );
    
    // Tự động xóa tin nhắn cảnh báo và lệnh sai sau 5 giây để tránh rác server
    setTimeout(() => {
      channelWarn.delete().catch(() => {});
      msg.delete().catch(() => {});
    }, 5000);
    return; // Dừng thực hiện các dòng code bên dưới
  }

  const uid = args[0];
  if (!uid || isNaN(uid)) return;

  const processing = await msg.reply({
    content: `⏳ Đang lấy thông tin người chơi **${uid}**...`,
  });

  const start = Date.now();

  try {
    const embed = await getFullInfoEmbed(uid, msg.author);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    // Gửi embed text
    await processing.edit({ content: null, embeds: [embed], files: [] });

    // ✅ Outfit API mới (KHÔNG sửa gì khác)
    const outfitImg = `https://free-fire-outfit-maker90x.vercel.app/?uid=${uid}&region=vn&api_key=sumu90n`;
    await msg.channel.send({
      embeds: [{ image: { url: outfitImg } }]
    });

  } catch (err) {
    console.error(err);
    processing.edit({ content: "⚠️ Không thể lấy dữ liệu người chơi!", files: [] });
  }
}
// ======= HẾT LỆNH INFO =======

// ======= LỆNH CHECK =======
if (command === "check") {
  
  // ID kênh được phép sử dụng lệnh check ban
  const allowedCheckChannel = "1450084107051733133";

  // Kiểm tra xem có đúng kênh cho phép không
  if (msg.channel.id !== allowedCheckChannel) {
    const channelWarn = await msg.reply(
      `❌ Lệnh này chỉ được dùng tại kênh: <#${allowedCheckChannel}>!`
    );
    
    // Tự động xóa tin nhắn cảnh báo và lệnh sai sau 5 giây
    setTimeout(() => {
      channelWarn.delete().catch(() => {});
      msg.delete().catch(() => {});
    }, 5000);
    return; // Dừng thực hiện lệnh
  }

  const uid = args[0];
  if (!uid || isNaN(uid)) return msg.reply("❌ UID không hợp lệ!");

  const processing = await msg.reply({
    content: `🔍 Đang kiểm tra UID **${uid}**...`,
  });

  try {
    // ===== API CHECK BAN MỚI =====
    const res = await fetch(`http://raw.thug4ff.xyz/check?uid=${uid}&key=great`);
    const data = await res.json();

    if (data.status !== 200 || !data.data) {
      throw new Error("Không tìm thấy UID");
    }

    const player = data.data;
    const nickname = player.nickname || "N/A";
    const region = player.region || "N/A";
    const level = player.level ?? "N/A";
    const lastLogin = player.last_login || "N/A";
    const exp = player.exp ?? "N/A";

    const banInfo = player.ban_info || {};
    const banStatus = player.is_banned;

    let title;
    let color;
    let image;
    let description;

    // ===== TRẠNG THÁI BAN =====

    // ❌ BAN VĨNH VIỄN
    if (banStatus === 1) {
      title = "⛔ Người chơi bị CẤM VĨNH VIỄN";
      color = "Red";
      image = "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253290639370/standard-1.gif";

      description =
`> **Lí do:** Tài khoản người chơi này đã bị ban vĩnh viễn do sử dụng phần mềm gian lận (pmt3).
> **Tên:** ${nickname}
> **UID:** \`${uid}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Thời gian bắt đầu ban:** ${formatTimestamp(banInfo.start_ban)}`;
    }

    // ⚠️ BAN TẠM THỜI
    else if (banStatus === 2) {
      title = "⚠️ Người chơi bị BAN TẠM THỜI";
      color = "Orange";
      image = "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253290639370/standard-1.gif";

      const banStart = banInfo.start_ban;
      const banEnd = banStart + banInfo.remaining_seconds;

      description = `
> **Trạng thái:** Tài khoản đang bị ban tạm thời, không nên log vào khi bị ban id (tạm thời) tránh ban cứ tiếp diễn.
> **Tên:** ${nickname}
> **UID:** \`${uid}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Bắt đầu ban:** <t:${banStart}:f>
> **Thời gian ban tạm thời kết thúc sau:** <t:${banEnd}:f>
`;
    }

    // ✅ KHÔNG BAN
    else {
      title = "✅ Người chơi an toàn";
      color = "Green";
      image = "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253886361610/standard-2.gif";

      description =
`> **Trạng thái:** Không phát hiện người chơi dùng phần mềm gian lận (pmt3).
> **Tên:** ${nickname}
> **UID:** \`${uid}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Lần đăng nhập cuối:** ${formatTimestamp(lastLogin)}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setDescription(description)
      .setThumbnail(
        msg.author.displayAvatarURL({ dynamic: true, size: 256 })
      )
      .setImage(image)
      .setFooter({ text: "Dev: Katari 📌" })
      .setTimestamp();

    await processing.edit({
      content: null,
      embeds: [embed],
      files: []
    });

  } catch (err) {
    console.error(err);
    try {
      await processing.edit({
        content: "🚫 Không thể kiểm tra người chơi!\n> API không phản hồi.",
        files: []
      });
    } catch {
      await msg.channel.send("🚫 Không thể kiểm tra người chơi!\n> API không phản hồi.");
    }
  }
}
// ======= HẾT LỆNH CHECK =======
