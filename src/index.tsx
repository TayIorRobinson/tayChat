/**
 * @file Provides the main entry point for tayChat.
 * @author Taylor Robinson <tayyiorrobinson@gmail.com>
 * @license LGPL-3.0
 */

import Roact from "@rbxts/roact";
import { TayChat } from "components/ChatCore";
import configuration, { TCConf } from "configuration";

export function loadTayChat(config: TCConf, mount: GuiBase | GuiObject | BasePlayerGui) {
	configuration.load(config);
	return Roact.mount(
		mount.IsA("BasePlayerGui") ? (
			<screengui ResetOnSpawn={false}>
				<TayChat></TayChat>
			</screengui>
		) : (
			<TayChat></TayChat>
		),
		mount,
		"tayChat",
	);
}
