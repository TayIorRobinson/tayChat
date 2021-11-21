/**
 * @file Contains the main logic for interacting with the default Roblox chat
 * 		 system & bundling similar messages together.
 * @author Taylor Robinson <tayyiorrobinson@gmail.com>
 * @license LGPL-3.0
 */

import { GetClientLuaChatService } from "@rbxts/chat-service";
import { ReplicatedStorage } from "@rbxts/services";
import { RBXChatMessage, SetCoreSystemMessage, TCMessage, TCMessageGroup, TCSayMessageRequest, TCSender } from "consts";
import { TCEventListener } from "./EventListener";
import { messageTypes } from "../components/messageTypes";

export class TCChatSystemInteraction extends TCEventListener {
	/**
	 * Maps the Roblox chat message ID to the corresponding chat message ID assigned to it by tayChat.
	 */
	rbxIdToTCIdLUT: Map<number, [number, number]> = new Map();
	messageHistory: TCMessageGroup[] = [];

	currentMessageId = 0;
	currentGroupId = 0;

	luaChatService = GetClientLuaChatService();
	chatSystem = ReplicatedStorage.WaitForChild("DefaultChatSystemChatEvents") as Folder;
	sendEvent = this.chatSystem.WaitForChild("SayMessageRequest") as RemoteEvent;
	recvEvent = this.chatSystem.WaitForChild("OnNewMessage") as RemoteEvent;
	fltrEvent = this.chatSystem.WaitForChild("OnMessageDoneFiltering") as RemoteEvent;
	sysmEvent = this.chatSystem.WaitForChild("OnNewSystemMessage") as RemoteEvent;
	constructor() {
		super();

		this.recvEvent.OnClientEvent.Connect((msg, channel) => this.handleIncomingMessage(msg, channel));
		this.sysmEvent.OnClientEvent.Connect((msg, channel) => this.handleIncomingMessage(msg, channel));
		this.fltrEvent.OnClientEvent.Connect((msg, channel) => this.editExistingMessage(msg, channel));
		this.luaChatService.ChatMakeSystemMessageEvent.connect((message) => {
			const msg = message as SetCoreSystemMessage;
			this.handleIncomingMessage(
				{
					ID: -1,
					FromSpeaker: "SetCore",
					SpeakerDisplayName: "System",
					SpeakerUserId: -1,

					OriginalChannel: "System",
					MessageLength: msg.Text.size(),
					MessageLengthUtf8: msg.Text.size(),
					MessageType: "System",
					IsFiltered: false,
					Message: msg.Text,
					Time: tick(),
					ExtraData: {
						ChatColor: msg.Color,
						Font: msg.Font,
						TextSize: msg.TextSize,
					},
				},
				"SetCore",
			);
		});
	}

	handleIncomingMessage(msg: RBXChatMessage, channel: string) {
		const latest = this.messageHistory[this.messageHistory.size() - 1];
		// Decides if the message should be added to the current group or a new group should be created.
		const cont =
			latest &&
			latest.channel === channel &&
			latest.type === msg.MessageType &&
			messageTypes.has(msg.MessageType) &&
			messageTypes.get(msg.MessageType)!.groupable &&
			latest.sender.userId === msg.SpeakerUserId;
		if (cont) {
			// Add the message to the current group.
			const message: TCMessage = {
				id: this.currentMessageId++,
				rbxId: msg.ID,
				message: msg.Message,
				length: msg.MessageLength,
				filtered: msg.IsFiltered,
				timestamp: msg.Time,
				extraData: msg.ExtraData,
			};
			latest.messages.push(message);
			this.messageHistory[latest.id] = latest;
			this.rbxIdToTCIdLUT.set(msg.ID, [latest.id, message.id]);
			this.emit("newMessageInGroup", message, latest);
			this.emit("newMessage", message, latest);
			this.emit("messagesUpdate");
		} else {
			// Create a new group.
			const sender: TCSender = {
				userId: msg.SpeakerUserId,
				username: msg.FromSpeaker,
				displayName: msg.SpeakerDisplayName,
				colour: msg.ExtraData.NameColor,
				tags: [],
			};
			this.currentMessageId = 1;
			const message: TCMessage = {
				id: 0,
				rbxId: msg.ID,
				message: msg.Message,
				length: msg.MessageLength,
				filtered: msg.IsFiltered,
				timestamp: msg.Time,
				extraData: msg.ExtraData,
			};
			const group: TCMessageGroup = {
				id: this.currentGroupId++,
				type: msg.MessageType,
				channel: channel,
				sender: sender,
				messages: [message],
				timestamp: msg.Time,
			};
			this.messageHistory[group.id] = group;
			this.rbxIdToTCIdLUT.set(msg.ID, [group.id, message.id]);
			this.emit("newMessageGroup", message, latest);
			this.emit("newMessage", message, latest);
			this.emit("messagesUpdate");
		}
	}
	editExistingMessage(msg: RBXChatMessage, channel: string) {
		if (!this.rbxIdToTCIdLUT.has(msg.ID)) return this.handleIncomingMessage(msg, channel);
		const tcid = this.rbxIdToTCIdLUT.get(msg.ID)!;
		const group = this.messageHistory[tcid[0]];

		// Add the message to the current group.
		const message: TCMessage = {
			id: tcid[1],
			rbxId: msg.ID,
			message: msg.Message,
			length: msg.MessageLength,
			filtered: msg.IsFiltered,
			timestamp: msg.Time,
			extraData: msg.ExtraData,
		};

		group.messages[tcid[1]] = message;

		this.emit("messageUpdated", message, channel);
		this.emit("messagesUpdate");
	}

	detectMessageChannel(msg: TCSayMessageRequest) {
		if (msg.channel) return msg.channel;
		if (msg.message.sub(0, 5) === "/team") {
			msg.message = msg.message.sub(7);
			return "Team";
		}
		if (msg.message.sub(0, 1) === "/") return "_silent";
		return "All";
	}

	handleMessageRequest(msg: TCSayMessageRequest) {
		const channel = this.detectMessageChannel(msg);
		// Send to RbxChat for filtering & broadcasting.
		if (channel !== "_silent") this.sendEvent.FireServer(msg.message, channel);
		// From RbxChat: Sends signal to eventually call Player:Chat() to handle C++ side legacy stuff.
		// (read: we want to fire .Chatted events for the scripts that use it)
		this.luaChatService.MessagePosted.fire(msg.message);
	}
}
