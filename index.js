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

// ===================== LỆNH !TEAM3 / !TEAM4 / !TEAM5 / !TEAM6 =====================
if (command.startsWith("team")) {

    const allowedTeamChannel = "1450085637020717117";

    // ❌ Sai kênh
    if (msg.channel.id !== allowedTeamChannel) {
        const channelWarn = await msg.reply(
            `❌ Lệnh tạo team chỉ được dùng tại kênh: <#${allowedTeamChannel}>!`
        );
        
        setTimeout(() => {
            channelWarn.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        return;
    }

    const teamNumber = command.replace("team", "");
    const uid = args[0];

    // ❌ team không hợp lệ
    if (!["3", "4", "5", "6"].includes(teamNumber)) return;

    // ❌ Sai UID
    if (!uid || isNaN(uid)) {
        const errMsg = await msg.reply(
            `> ❌ Sai cú pháp!\n> Ví dụ: \`!team${teamNumber} 12345678\``
        );

        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);

        return;
    }

    // ⏳ Loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang tạo team ${teamNumber}...**\n> UID: **${uid}**`
    );

    // ✅ API MỚI (Cloudflare)
    const apiUrl = `https://registry-century-communicate-submissions.trycloudflare.com/${teamNumber}?uid=${uid}`;

    try {

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        // ❌ nếu không có message coi như fail
        if (!data || !data.message) throw new Error("Tạo team thất bại");

        // ✨ sửa bot name
        const fixedStatus = data.status?.replace("bot by mafu", "bot by katari");

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`🎮 Team ${teamNumber} đã sẵn sàng`)
            .setDescription(
`> **Người yêu cầu:** <@${msg.author.id}>
> **UID:** \`${uid}\`
> **Team:** ${teamNumber}
> **Bot:** ${fixedStatus || "bot by katari"}
> 📩 **Trạng thái:** ${data.message}`
            )
            .setThumbnail(
                msg.author.displayAvatarURL({ dynamic: true, size: 256 })
            )
            .setFooter({ text: "Dev Katari" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ **Tạo team thành công!**",
            embeds: [embed]
        });

    } catch (err) {

        console.error(err);

        const errMsg = await msg.reply(
            "❌ **Không thể tạo team. API lỗi hoặc không phản hồi.**"
        );

        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);

        loadingMsg.delete().catch(() => {});
    }
}
// ===================== HẾT LỆNH TEAM =====================

// ===================== LỆNH !EMOTE (1 người) =====================
if (command === "emote") {

    // ID kênh được phép sử dụng lệnh emote
    const allowedEmoteChannel = "1450085765764747420";

    // 1. Kiểm tra xem có đúng kênh cho phép không
    if (msg.channel.id !== allowedEmoteChannel) {
        const channelWarn = await msg.reply(
            `❌ Lệnh emote chỉ được dùng tại kênh: <#${allowedEmoteChannel}>!`
        );
        
        // Tự động xóa cảnh báo và lệnh sai sau 5 giây
        setTimeout(() => {
            channelWarn.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        return; // Dừng thực hiện lệnh
    }

    const teamcode = args[0];
    const uid = args[1];
    let emoteInput = args[2]; // có thể là tên hoặc ID

    // 2. Kiểm tra sai cú pháp
    if (!teamcode || !uid || !emoteInput) {
        const errMsg = await msg.reply(
            "> ❌ Sai cú pháp!\n" +
            "> Ví dụ: `!emote 1234567 12345678 m60`"
        );
        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 6000);
        return;
    }

    // === Map tên hành động → emote ID ===
    const emoteMap = {
        ak47: "909000063",
        scar: "909000068",
        mp401: "909000075",
        mp402: "909040010",
        m10141: "909000081",
        m10142: "909039011",
        xm8: "909000085",
        ump: "909000098",
        mp5: "909033002",
        famas: "909000090",
        m1887: "909035007",
        thomson: "909038010",
        an94: "909035012",
        m4a1: "909033001",
        g18: "909038012",
        namdam: "909037011",
        groza: "909041005",
        chimgokien: "909042008",
        paralfell: "909045001",
        p90: "909049010",
        m60: "909051003",
        ngaivang: "909000014",
        camco: "909000034",
        camco2: "909000128",
        tanghoa: "909000010",
        thatim: "909000045",
        muaxe: "909000074",
        muaxe2: "909000088",
        lv100: "909042007",
        tim: "909043010",
        tim2: "909043013",
        tim3: "909047003",
        bapbenh: "909045012",
        anmung: "909046004",
        laugiay: "909046005",
        narutodoi: "909050003",
        lienket: "909049008",
        cuu: "909050013",
        choicungnhau: "909051017",
        giangsinh1: "909051002",
        giangsinh2: "909051018",
        giangsinh3: "909051019",
        giangsinh4: "909051020",
        naruto: "909050002"
    };

    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // Loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang gửi emote ${emoteId} đến UID ${uid}...**`
    );

    // 🔥 API EMOTE MỚI
    const apiUrl =
        `https://entrance-city-proposition-blond.trycloudflare.com/join` +
        `?tc=${teamcode}` +
        `&uid1=${uid}` +
        `&emote_id=${emoteId}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("🎭 Gửi Emote Thành Công!")
            .setDescription(
                `> Người dùng: <@${msg.author.id}>\n` +
                `> Team code: **${teamcode}**\n` +
                `> UID: **${uid}**\n` +
                `> Emote ID: **${emoteId}**\n\n` +
                `✨ ${data.message || "Emote triggered"}`
            )
            .setFooter({ text: "Dev Katari📌" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ **Kết quả:**",
            embeds: [embed]
        });

    } catch (err) {
        console.log(err);
        const errMsg = await msg.reply(
            "❌ **Không thể gửi emote. API gặp lỗi hoặc không phản hồi.**"
        );
        
        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        
        loadingMsg.delete().catch(() => {});
    }
}
// ===================== HẾT LỆNH EMOTE =====================

// ===================== LỆNH !RANDOM (AUTO EMOTE 1 UID) =====================
if (command === "random") {

    // ID kênh được phép sử dụng lệnh random (chung kênh với emote)
    const allowedRandomChannel = "1450085765764747420";

    // 1. Kiểm tra xem có đúng kênh cho phép không
    if (msg.channel.id !== allowedRandomChannel) {
        const channelWarn = await msg.reply(
            `❌ Lệnh auto emote chỉ được dùng tại kênh: <#${allowedRandomChannel}>!`
        );
        
        // Tự động xóa cảnh báo và lệnh sai sau 5 giây
        setTimeout(() => {
            channelWarn.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        return; // Dừng thực hiện lệnh
    }

    // ================= STOP =================
    if (args[0] === "stop") {
        if (!randomRunning) {
            const m = await msg.reply("⚠️ **Hiện không có auto emote nào đang chạy!**");
            return setTimeout(() => {
                m.delete().catch(() => {});
                msg.delete().catch(() => {});
            }, 5000);
        }

        if (
            msg.author.id !== randomUserId &&
            !msg.member.permissions.has("Administrator")
        ) {
            const m = await msg.reply("🚫 **Bạn không có quyền dừng auto này!**");
            return setTimeout(() => {
                m.delete().catch(() => {});
                msg.delete().catch(() => {});
            }, 5000);
        }

        randomStop = true;
        const m = await msg.reply("🛑 **Đã gửi yêu cầu dừng auto emote!**");
        return setTimeout(() => {
            m.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
    }

    // ================= CHECK ĐANG CHẠY =================
    if (randomRunning) {
        const m = await msg.reply(
            `⏳ **Đang có auto khác chạy!**\n👤 Người dùng: <@${randomUserId}>`
        );
        return setTimeout(() => {
            m.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
    }

    const teamcode = args[0];
    const uid = args[1];

    if (!teamcode || !uid) {
        const m = await msg.reply(
            "> ❌ Sai cú pháp!\n> Ví dụ: `!random 1234567 12345678`"
        );
        return setTimeout(() => {
            m.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
    }

    // ================= KHÓA CHUNG =================
    randomRunning = true;
    randomUserId = msg.author.id;
    randomUserTag = msg.author.tag;
    randomStop = false;

    // ================= MAP EMOTE =================
    const emoteMap = {
        ak47: "909000063",
        scar: "909000068",
        mp401: "909000075",
        mp402: "909040010",
        m10141: "909000081",
        m10142: "909039011",
        xm8: "909000085",
        ump: "909000098",
        mp5: "909033002",
        famas: "909000090",
        m1887: "909035007",
        thomson: "909038010",
        an94: "909035012",
        m4a1: "909033001",
        g18: "909038012",
        groza: "909041005",
        p90: "909049010",
        m60: "909051003"
    };

    const emoteEntries = Object.entries(emoteMap);
    const total = emoteEntries.length;

    randomMessage = await msg.reply(
        `🤖 **Bắt đầu auto emote (1 UID)...**\n` +
        `> Team code: **${teamcode}**\n` +
        `> UID: **${uid}**`
    );

    try {
        let index = 0;

        for (const [emoteName, emoteId] of emoteEntries) {

            if (randomStop) {
                await randomMessage.edit(
                    `🛑 **Auto Emote đã bị dừng!**\n` +
                    `⏹ Dừng tại: **${emoteName.toUpperCase()}**`
                );
                break;
            }

            index++;

            await randomMessage.edit(
                `🤖 **Auto Emote (${index}/${total})**\n` +
                `🎭 Emote: **${emoteName.toUpperCase()}**\n` +
                `⏱ Tiếp theo sau **5 giây**`
            );

            const apiUrl =
                `https://entrance-city-proposition-blond.trycloudflare.com/join` +
                `?tc=${teamcode}&uid1=${uid}&emote_id=${emoteId}`;

            await fetch(apiUrl);
            await new Promise(r => setTimeout(r, 5000));
        }

        if (!randomStop) {
            await randomMessage.edit("🎉 **Hoàn tất auto emote!**");
        }

    } catch (err) {
        console.error(err);
        await msg.reply("❌ **Lỗi API – Auto emote bị hủy!**");
    }

    // ================= NHẢ KHÓA =================
    randomRunning = false;
    randomUserId = null;
    randomUserTag = null;
    randomStop = false;
    randomMessage = null;
}
// ===================== HẾT LỆNH RANDOM =====================

// ===================== LỆNH !EMOTES (MULTI UID) =====================
if (command === "emotes") {

    // ID kênh được phép sử dụng lệnh emotes (chung kênh với emote và random)
    const allowedEmotesChannel = "1450085765764747420";

    // 1. Kiểm tra xem có đúng kênh cho phép không
    if (msg.channel.id !== allowedEmotesChannel) {
        const channelWarn = await msg.reply(
            `❌ Lệnh emote nhiều người chỉ được dùng tại kênh: <#${allowedEmotesChannel}>!`
        );
        
        // Tự động xóa cảnh báo và lệnh sai sau 5 giây
        setTimeout(() => {
            channelWarn.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        return; // Dừng thực hiện lệnh
    }

    const teamcode = args[0];
    const uid1 = args[1];
    const uid2 = args[2];
    const uid3 = args[3];
    const uid4 = args[4];
    const uid5 = args[5];
    const uid6 = args[6];
    const emoteInput = args[7]; // tên hoặc ID

    // 2. Kiểm tra sai cú pháp
    if (!teamcode || !uid1 || !emoteInput) {
        const m = await msg.reply(
            "> ❌ Sai cú pháp!\n" +
            "> Ví dụ:\n" +
            "> `!emotes 1234567 111 m60`\n" +
            "> `!emotes 1234567 111 222 333 444 naruto`"
        );
        
        setTimeout(() => {
            m.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 6000);
        return;
    }

    // ================= MAP EMOTE (GIỮ NGUYÊN) =================
    const emoteMap = {
        ak47: "909000063", scar: "909000068", mp401: "909000075", mp402: "909040010",
        m10141: "909000081", m10142: "909039011", xm8: "909000085", ump: "909000098",
        mp5: "909033002", famas: "909000090", m1887: "909035007", thomson: "909038010",
        an94: "909035012", m4a1: "909033001", g18: "909038012", namdam: "909037011",
        groza: "909041005", chimgokien: "909042008", paralfell: "909045001", p90: "909049010",
        m60: "909051003", ngaivang: "909000014", camco: "909000034", camco2: "909000128",
        tanghoa: "909000010", thatim: "909000045", muaxe: "909000074", muaxe2: "909000088",
        lv100: "909042007", tim: "909043010", tim2: "909043013", tim3: "909047003",
        bapbenh: "909045012", anmung: "909046004", laugiay: "909046005", narutodoi: "909050003",
        lienket: "909049008", cuu: "909050013", choicungnhau: "909051017", giangsinh1: "909051002",
        giangsinh2: "909051018", giangsinh3: "909051019", giangsinh4: "909051020", naruto: "909050002"
    };

    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // ================= API EMOTE NHIỀU NGƯỜI =================
    const apiUrl =
        `https://entrance-city-proposition-blond.trycloudflare.com/join` +
        `?tc=${teamcode}` +
        `&uid1=${uid1}` +
        `${uid2 ? `&uid2=${uid2}` : ""}` +
        `${uid3 ? `&uid3=${uid3}` : ""}` +
        `${uid4 ? `&uid4=${uid4}` : ""}` +
        `${uid5 ? `&uid5=${uid5}` : ""}` +
        `${uid6 ? `&uid6=${uid6}` : ""}` +
        `&emote_id=${emoteId}`;

    // ================= LOADING =================
    const loadingMsg = await msg.reply(
        `⏳ **Đang gửi emote cho nhiều người...**\n` +
        `🎭 Emote: **${emoteId}**`
    );

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const uidList =
            `• ${uid1}\n` +
            `${uid2 ? `• ${uid2}\n` : ""}` +
            `${uid3 ? `• ${uid3}\n` : ""}` +
            `${uid4 ? `• ${uid4}\n` : ""}` +
            `${uid5 ? `• ${uid5}\n` : ""}` +
            `${uid6 ? `• ${uid6}\n` : ""}`;

        const embed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("🎭 Gửi Emote Thành Công!")
            .setDescription(
                `> Người dùng: <@${msg.author.id}>\n` +
                `> Team code: **${teamcode}**\n` +
                `> Emote ID: **${emoteId}**\n\n` +
                `👥 **Danh sách UID:**\n${uidList}\n` +
                `✨ ${data.message || "Emote triggered"}`
            )
            .setFooter({ text: "Dev Katari📌" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ **Kết quả:**",
            embeds: [embed]
        });

    } catch (err) {
        console.error(err);
        const m = await msg.reply("❌ **Không thể gửi emote – API lỗi**");
        
        setTimeout(() => {
            m.delete().catch(() => {});
            msg.delete().catch(() => {}); // Xóa luôn tin nhắn lệnh gốc
            loadingMsg.delete().catch(() => {});
        }, 5000);
    }
}
// ===================== HẾT LỆNH EMOTES =====================

// ===================== LỆNH !RANDOMS (AUTO EMOTE MULTI UID) =====================
if (command === "randoms") {

    // ID kênh được phép sử dụng (Dùng chung với các lệnh emote khác)
    const allowedRandomsChannel = "1450085765764747420";

    // 1. Kiểm tra xem có đúng kênh cho phép không
    if (msg.channel.id !== allowedRandomsChannel) {
        const channelWarn = await msg.reply(
            `❌ Lệnh auto emote nhiều người chỉ được dùng tại kênh: <#${allowedRandomsChannel}>!`
        );
        
        // Tự động xóa cảnh báo và lệnh sai sau 5 giây
        setTimeout(() => {
            channelWarn.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        return; // Dừng thực hiện lệnh
    }

    // ================= STOP =================
    if (args[0] === "stop") {
        if (!randomsRunning) {
            const m = await msg.reply("⚠️ **Hiện không có auto emote nào đang chạy!**");
            setTimeout(() => {
                m.delete().catch(() => {});
                msg.delete().catch(() => {});
            }, 5000);
            return;
        }

        if (msg.author.id !== randomsUserId && !msg.member.permissions.has("Administrator")) {
            const m = await msg.reply("🚫 **Bạn không có quyền dừng auto emote này!**");
            setTimeout(() => {
                m.delete().catch(() => {});
                msg.delete().catch(() => {});
            }, 5000);
            return;
        }

        randomsStop = true;
        const m = await msg.reply("🛑 **Đã gửi yêu cầu dừng auto emote!**");
        setTimeout(() => {
            m.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        return;
    }

    // ================= CHECK ĐANG CHẠY =================
    if (randomsRunning) {
        const m = await msg.reply(
            "⏳ **Auto emote đang được sử dụng!**\n⚠️ Vui lòng chờ hoàn tất."
        );
        setTimeout(() => {
            m.reply.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
        return;
    }

    const teamcode = args[0];
    const uidList = args.slice(1).filter(Boolean);

    if (!teamcode || uidList.length === 0) {
        const m = await msg.reply(
            "> ❌ Sai cú pháp!\n" +
            "> Ví dụ:\n" +
            "> `!randoms 1234567 111`\n" +
            "> `!randoms 1234567 111 222 333 444 555 666`"
        );
        setTimeout(() => {
            m.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 6000);
        return;
    }

    // ================= KHÓA =================
    randomsRunning = true;
    randomsUserId = msg.author.id;
    randomsStop = false;

    // ================= MAP EMOTE =================
    const emoteMap = {
        ak47: "909000063", scar: "909000068", mp401: "909000075", mp402: "909040010",
        m10141: "909000081", m10142: "909039011", xm8: "909000085", ump: "909000098",
        mp5: "909033002", famas: "909000090", m1887: "909035007", thomson: "909038010",
        an94: "909035012", m4a1: "909033001", g18: "909038012", groza: "909041005",
        p90: "909049010", m60: "909051003"
    };

    const emoteEntries = Object.entries(emoteMap);
    const total = emoteEntries.length;

    // ================= START =================
    randomsMessage = await msg.reply(
        `🤖 **Bắt đầu auto emote (MULTI UID)...**\n` +
        `> Team code: **${teamcode}**\n` +
        `> UID: ${uidList.join(", ")}`
    );

    try {
        let index = 0;

        for (const [emoteName, emoteId] of emoteEntries) {

            if (randomsStop) {
                await randomsMessage.edit(
                    `🛑 **Auto Emote đã bị dừng!**\n` +
                    `⏹ Dừng tại: **${emoteName.toUpperCase()}**`
                );
                break;
            }

            index++;

            await randomsMessage.edit(
                `🤖 **Auto Emote (${index}/${total})**\n` +
                `🎭 Emote: **${emoteName.toUpperCase()}**\n` +
                `⏱ Tiếp theo sau **5 giây**`
            );

            // ✅ API MỚI (Xây dựng URL động dựa trên số lượng UID)
            const apiUrl =
                `https://entrance-city-proposition-blond.trycloudflare.com/join` +
                `?tc=${teamcode}` +
                uidList.map((uid, i) => `&uid${i + 1}=${uid}`).join("") +
                `&emote_id=${emoteId}`;

            await fetch(apiUrl);
            await new Promise(r => setTimeout(r, 5000));
        }

        if (!randomsStop) {
            const embed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("🤖 Auto Emote Hoàn Tất!")
                .setDescription(
                    `> Team code: **${teamcode}**\n` +
                    `> UID: ${uidList.join(", ")}\n\n` +
                    `✅ **Hoàn tất toàn bộ emote**`
                )
                .setFooter({ text: "Dev Katari📌" })
                .setTimestamp();

            await randomsMessage.edit({
                content: "🎉 **Hoàn tất auto emote!**",
                embeds: [embed]
            });
        }

    } catch (err) {
        console.error(err);
        const m = await msg.reply("❌ **Lỗi API – Auto emote bị hủy!**");
        setTimeout(() => {
            m.delete().catch(() => {});
            randomsMessage?.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);
    }

    // ================= NHẢ KHÓA =================
    randomsRunning = false;
    randomsUserId = null;
    randomsStop = false;
    randomsMessage = null;
}
// ===================== HẾT LỆNH RANDOM S =====================

// ==================== HÀM BỔ TRỢ (CHUYỂN ĐỔI THỜI GIAN) ====================
function formatTimestampV2(timestamp) {
  if (!timestamp || timestamp === "0") return "not found";
  // Chuyển từ giây sang milisecond để format
  const date = new Date(parseInt(timestamp) * 1000);
  if (isNaN(date.getTime())) return "not found";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} VNT`;
}

// ==================== HÀM INFO (FULL CẬP NHẬT PRIME) ====================
async function getFullInfoEmbed(uid, user) {
  let data = {};

  try {
    // Gọi API info mới
    const res = await fetch(`https://oven-roof-cheque-easter.trycloudflare.com/uc-info?uid=${uid}&key=KatarixInfo`);
    if (!res.ok) throw new Error("API info không phản hồi");
    data = await res.json(); 
  } catch (err) {
    console.warn("Không lấy được data API:", err);
  }

  // ===== Mapping dữ liệu từ JSON mới =====
  const basic   = data?.basicInfo || {};
  const profile = data?.profileInfo || {};
  const pet     = data?.petInfo || {};
  const credit  = data?.creditScoreInfo || {};
  const clan    = data?.clanBasicInfo || {};
  const captain = data?.captainBasicInfo || {};
  const social  = data?.socialInfo || {};
  const prime   = data?.basicInfo?.primeInfo || {}; // Lấy cấp Prime

  // API Banner vẫn giữ nguyên
  const bannerImg = `http://raw.sukhdaku.eu.cc/profile/profile?uid=${uid}`;

  // Màu sắc theo Rank BR
  const color = getRankColor(basic?.rankingPoints);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔎 Thông tin người chơi: **${basic?.nickname || uid}**`)
    .setAuthor({ name: user.username })
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setImage(bannerImg)
    .setFooter({ text: "Dev: Katari 📌" });

  const fields = [];

  // ===== THÔNG TIN CƠ BẢN (Đã thêm Cấp Prime) =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  THÔNG TIN CƠ BẢN**\n" +
      `**├─ Tên**: ${basic?.nickname ?? "not found"}\n` +
      `**├─ UID**: \`${basic?.accountId ?? "not found"}\`\n` +
      `**├─ Cấp độ**: ${basic?.level ?? "not found"} (Exp: ${basic?.exp ?? "not found"})\n` +
      `**├─ Khu vực**: ${basic?.region ?? "not found"}\n` +
      `**├─ Lượt thích**: ${basic?.liked ?? "not found"}\n` +
      `**├─ Cấp prime**: ${prime?.primeLevel ?? "0"}\n` + // Hiển thị Cấp Prime
      `**├─ Điểm uy tín**: ${credit?.creditScore ?? "not found"}\n` +
      `**└─ Tiểu sử**: ${social?.signature || "not found"}`
  });

  // ===== HOẠT ĐỘNG TÀI KHOẢN =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  HOẠT ĐỘNG TÀI KHOẢN**\n" +
      `**├─ Phiên bản gần nhất**: ${basic?.releaseVersion ?? "not found"}\n` +
      `**├─ Huy hiệu BP hiện tại**: ${basic?.badgeCnt ?? "not found"}\n` +
      `**├─ Rank BR**: ${basic?.rankingPoints ?? "not found"}\n` +
      `**├─ Rank CS**: ${basic?.csRankingPoints ?? "not found"}\n` +
      `**├─ Ngày tạo**: ${formatTimestampV2(basic?.createAt)}\n` +
      `**└─ Đăng nhập gần nhất**: ${formatTimestampV2(basic?.lastLoginAt)}`
  });

  // ===== TỔNG QUAN =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  TỔNG QUAN**\n" +
      `**├─ Avatar ID**: ${basic?.headPic ?? "not found"}\n` +
      `**├─ Banner ID**: ${basic?.bannerId ?? "not found"}\n` +
      `**├─ Pin ID**: ${basic?.pinId ?? "not found"}\n` +
      `**└─ Kỹ năng được trang bị**: [${
        profile?.equipedSkills?.join(", ") || "not found"
      }]`
  });

  // ===== THÚ CƯNG =====
  if (pet?.id) {
    fields.push({
      name: "\u200b",
      value:
        "**┌  THÚ CƯNG**\n" +
        `**├─ Đang dùng?**: ${pet?.isSelected ? "Có" : "Không"}\n` +
        `**├─ ID thú cưng**: ${pet?.id ?? "not found"}\n` +
        `**├─ Kinh nghiệm**: ${pet?.exp ?? "not found"}\n` +
        `**└─ Cấp độ**: ${pet?.level ?? "not found"}`
    });
  }

  // ===== QUÂN ĐOÀN =====
  if (clan?.clanId) {
    fields.push({
      name: "\u200b",
      value:
        "**┌  QUÂN ĐOÀN**\n" +
        `**├─ Tên quân đoàn**: ${clan?.clanName ?? "not found"}\n` +
        `**├─ ID quân đoàn**: \`${clan?.clanId ?? "not found"}\`\n` +
        `**├─ Cấp quân đoàn**: ${clan?.clanLevel ?? "not found"}\n` +
        `**├─ Tổng thành viên hiện tại**: ${clan?.memberNum ?? "0"}/${clan?.capacity ?? "0"}\n` +
        "**└─ Thông tin chủ quân đoàn**:\n" +
        `    **├─ Tên**: ${captain?.nickname ?? "not found"}\n` +
        `    **├─ UID**: \`${captain?.accountId ?? "not found"}\`\n` +
        `    **├─ Cấp độ**: ${captain?.level ?? "not found"} (Exp: ${captain?.exp ?? "not found"})\n` +
        `    **├─ Lần đăng nhập gần nhất**: ${formatTimestampV2(captain?.lastLoginAt)}\n` +
        `    **├─ Huy hiệu BP**: ${captain?.badgeCnt ?? "not found"}\n` +
        `    **├─ Rank BR**: ${captain?.rankingPoints ?? "not found"}\n` +
        `    **└─ Rank CS**: ${captain?.csRankingPoints ?? "not found"}`
    });
  }

  embed.addFields(fields);
  return embed;
}

// ==================== LOGIN BOT ====================

console.log("TOKEN length:", process.env.TOKEN?.length);

client.login(process.env.TOKEN)
  .then(() => console.log("✅ Login thành công"))
  .catch(err => console.error("❌ Login lỗi:", err));



// ====== EXPRESS KEEP-ALIVE ======
const app = express();
const PORT = process.env.PORT || 3000;

// Route ping
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Ping server online on port ${PORT}`);
});
