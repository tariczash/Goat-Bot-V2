const { getTime, drive } = global.utils;

module.exports = {
        config: {
                name: "leave",
                version: "1.4",
                author: "NTKhang",
                category: "events"
        },

        langs: {
                vi: {
                        session1: "sáng",
                        session2: "trưa",
                        session3: "chiều",
                        session4: "tối",
                        leaveType1: "tự rời",
                        leaveType2: "bị kick",
                        defaultLeaveMessage: "{userName} đã {type} khỏi nhóm"
                },
                en: {
                        session1: "𝗠𝗢𝗥𝗡𝗜𝗡𝗚",
                        session2: "𝗡𝗢𝗢𝗡",
                        session3: "𝗔𝗙𝗧𝗘𝗥𝗡𝗢𝗢𝗡",
                        session4: "𝗘𝗩𝗘𝗡𝗜𝗡𝗚",
                        leaveType1: "𝗟𝗘𝗙𝗧",
                        leaveType2: "𝗪𝗔𝗦 𝗞𝗜𝗖𝗞𝗘𝗗 𝗙𝗥𝗢𝗠",
                        defaultLeaveMessage: "𝗠𝗬 𝗕𝗪𝗘𝗦𝗜𝗧 𝗡𝗔 𝗙𝗥𝗜𝗘𝗡𝗗 {userName} {type} 𝗧𝗢 𝗧𝗛𝗘 𝗚𝗥𝗢𝗨𝗣🫵😹."
                }
        },

        onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
                if (event.logMessageType == "log:unsubscribe")
                        return async function () {
                                const { threadID } = event;
                                const threadData = await threadsData.get(threadID);
                                if (!threadData.settings.sendLeaveMessage)
                                        return;
                                const { leftParticipantFbId } = event.logMessageData;
                                if (leftParticipantFbId == api.getCurrentUserID())
                                        return;
                                const hours = getTime("HH");

                                const threadName = threadData.threadName;
                                const userName = await usersData.getName(leftParticipantFbId);

                                // {userName}   : name of the user who left the group
                                // {type}       : type of the message (leave)
                                // {boxName}    : name of the box
                                // {threadName} : name of the box
                                // {time}       : time
                                // {session}    : session

                                let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
                                const form = {
                                        mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{
                                                tag: userName,
                                                id: leftParticipantFbId
                                        }] : null
                                };

                                leaveMessage = leaveMessage
                                        .replace(/\{userName\}|\{userNameTag\}/g, userName)
                                        .replace(/\{type\}/g, leftParticipantFbId == event.author ? getLang("leaveType1") : getLang("leaveType2"))
                                        .replace(/\{threadName\}|\{boxName\}/g, threadName)
                                        .replace(/\{time\}/g, hours)
                                        .replace(/\{session\}/g, hours <= 10 ?
                                                getLang("session1") :
                                                hours <= 12 ?
                                                        getLang("session2") :
                                                        hours <= 18 ?
                                                                getLang("session3") :
                                                                getLang("session4")
                                        );

                                form.body = leaveMessage;

                                if (leaveMessage.includes("{userNameTag}")) {
                                        form.mentions = [{
                                                id: leftParticipantFbId,
                                                tag: userName
                                        }];
                                }

                                if (threadData.data.leaveAttachment) {
                                        const files = threadData.data.leaveAttachment;
                                        const attachments = files.reduce((acc, file) => {
                                                acc.push(drive.getFile(file, "stream"));
                                                return acc;
                                        }, []);
                                        form.attachment = (await Promise.allSettled(attachments))
                                                .filter(({ status }) => status == "fulfilled")
                                                .map(({ value }) => value);
                                }
                                message.send(form);
                        };
        }
};
