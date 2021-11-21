/**
 * @file Provides type definitions for objects & interfaces used by tayChat.
 * @author Taylor Robinson <tayyiorrobinson@gmail.com>
 * @license LGPL-3.0
 */

import { ExtraData, MessageType } from "@rbxts/chat-service";

export interface DefaultUIElementProps {
	size?: UDim2;
	position?: UDim2;
	constraint?: Enum.SizeConstraint;
	anchor?: Vector2;
}

interface TCSender {
	userId: number;
	username: string;
	displayName?: string;
	tags: string[];
	colour?: Color3;
}
interface TCMessage {
	id: number;
	rbxId: number;
	message?: string;
	length: number;
	filtered: boolean;
	timestamp: number;
	extraData: ExtraData;
}
interface TCMessageGroup {
	id: number;
	type: MessageType;
	channel: string;
	sender: TCSender;
	messages: TCMessage[];
	timestamp: number;
}

interface RBXChatMessage {
	ID: number;

	FromSpeaker: string;
	SpeakerDisplayName?: string;
	SpeakerUserId: number;

	OriginalChannel: string;

	MessageLength: number;
	MessageLengthUtf8: number;
	MessageType: MessageType;
	IsFiltered: boolean;
	Message?: string;

	Time: number;
	ExtraData: ExtraData;
}
export interface SetCoreSystemMessage {
	Text: string;
	Color?: Color3;
	Font?: Enum.Font;
	TextSize?: number;
}

interface chatMessageGroupRendererProps {
	messageGroup: TCMessageGroup;
}

interface TCSayMessageRequest {
	// Override the channel. `_silent` is used to indicate that the message should not be sent to other players.
	channel?: string;
	message: string;
}
