/**
 * @file Implements the tayChat component, which displays the core chat GUI: MessageHistory, ChatBox & TypingIndicator.
 * @author Taylor Robinson <tayyiorrobinson@gmail.com>
 * @license LGPL-3.0
 */

import Roact, { Component } from "@rbxts/roact";
import { TCMessageGroup } from "consts";
import { TCChatSystemInteraction } from "logic/ChatInteraction";
import { ChatBox } from "./ChatBox";
import { MessageHistory } from "./MessageHistory";
import { TypingIndicator } from "./TypingIndicator";

interface ChatProps {}
interface ChatState {
	messageHistory: TCMessageGroup[];
}
export class TayChat extends Component<ChatProps, ChatState> {
	ChatInteraction: TCChatSystemInteraction = new TCChatSystemInteraction();

	PositionBinding = Roact.createBinding(new UDim2(0, 0, 1, -200));
	SizeBinding = Roact.createBinding(new UDim2(0, 575, 0, 200));
	ChatBoxDisabled = false;

	constructor(P: ChatProps) {
		super(P);
		this.ChatInteraction.on("messagesUpdate", () => {
			this.setState({
				messageHistory: this.ChatInteraction.messageHistory,
			});
		});
		this.ChatInteraction.luaChatService.VisibilityStateChanged.connect(() => {
			wait();
			this.setState({});
		});
		this.ChatInteraction.luaChatService.CoreGuiEnabled.connect(() => {
			wait();
			this.setState({});
		});
		this.ChatInteraction.luaChatService.ChatWindowPositionEvent.connect((pos: UDim2) =>
			this.PositionBinding[1](pos),
		);
		this.ChatInteraction.luaChatService.ChatWindowSizeEvent.connect((size: UDim2) => this.SizeBinding[1](size));
		this.ChatInteraction.luaChatService.ChatBarDisabledEvent.connect((disabled: boolean) => {
			this.ChatBoxDisabled = disabled;
			this.setState({});
		});
	}
	didMount() {
		if (!this.state.messageHistory) this.setState({ messageHistory: this.ChatInteraction.messageHistory });
	}

	render() {
		return (
			<frame
				Key="tayChat"
				BackgroundTransparency={1}
				Size={this.SizeBinding[0]}
				ClipsDescendants={false}
				Position={this.PositionBinding[0]}
				Visible={
					this.ChatInteraction.luaChatService.Visible && this.ChatInteraction.luaChatService.IsCoreGuiEnabled
				}
			>
				<uilistlayout
					VerticalAlignment={Enum.VerticalAlignment.Bottom}
					SortOrder={Enum.SortOrder.LayoutOrder}
					Padding={new UDim(0, 4)}
				></uilistlayout>
				<MessageHistory
					messages={this.state.messageHistory || this.ChatInteraction.messageHistory || []}
				></MessageHistory>
				{this.ChatBoxDisabled ? undefined : (
					<ChatBox OnChatted={(m) => this.ChatInteraction.handleMessageRequest(m)}></ChatBox>
				)}
				{/*<TypingIndicator typingUsers={["47757673", "47757673", "47757673"]}></TypingIndicator>*/}
			</frame>
		);
	}
}
