import { Entity, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import TapperNPC, { TapperAction } from "./tappernpc";

namespace TapperUI {

    export function manage(entity: Entity, player: Player, callback?: () => void) {
        if (entity.typeId !== TapperNPC.entityId) return callback && callback();

        const form = new ActionFormData();

        form.title("§6TapperNPC");
        form.button("§dManage Actions", "textures/ui/ImpulseSquare");
        form.button("§dEdit Nametag", "textures/ui/hanging_sign_jungle");
        form.button("§dChange Skin", "textures/ui/sidebar_icons/classic_skins");
        form.button("§dChange Cape", "textures/ui/sidebar_icons/capes");
        form.button("§dChange Model", "textures/ui/sidebar_icons/dr_body");
        form.button("§4DELETE", "textures/ui/trash");
        form.button(`§8[ §c${ callback ? `BACK` : `CLOSE`} §8]`, "textures/blocks/barrier");

        form.show(player as any).then((res) => {
            if (res.selection === undefined) return;
            if (res.selection === 0) return Actions.main(entity, player, () => manage(entity, player, callback));
            if (res.selection === 1) return editNameTag(entity, player, () => manage(entity, player, callback));
            if (res.selection === 2) return changeSkin(entity, player, () => manage(entity, player, callback));
            if (res.selection === 3) return changeCape(entity, player, () => manage(entity, player, callback));
            if (res.selection === 4) return changeModel(entity, player, () => manage(entity, player, callback));
            if (res.selection === 5) return deleteNPC(entity, player, () => manage(entity, player, callback));
            if (res.selection === 6 && callback) return callback();
        });
    }

    export async function deleteNPC(entity: Entity, player: Player, callback?: () => void) {
        const actions = TapperNPC.getActions(entity);
        const form = new ActionFormData();
        const description = `§cAre you sure wanna delete this tapper npc?§r\n\nTapperNPC:\n - "${TapperNPC.getNameTag(entity)}§r"\n\nActions: §b${actions.length}§r\n\n`;

        form.title('§6TapperNPC: §cDELETE');
        form.body(description);
        form.button('§4DELETE', 'textures/ui/trash');
        form.button(`§8[ §c${ callback ? `BACK` : `CLOSE`} §8]`, "textures/blocks/barrier");
        
        form.show(player as any).then((res) => {
            if (res.selection === 0) {
                try {
                    entity.remove();
                } catch(err: any) {}
            }
            if (res.selection === 1 && callback) callback();
        });
    }

    export function editNameTag(entity: Entity, player: Player, callback?: () => void) {
        if (entity.typeId !== TapperNPC.entityId) return;

        const form = new ModalFormData();

        form.title("§6TapperNPC: §eNameTag");
        form.textField("NameTag", "Shop NPC", {
            defaultValue: TapperNPC.getNameTag(entity),
            tooltip: "The display nametag of npc. Empty the nametag for hide",
        });

        form.show(player as any).then((res) => {
            if (res.formValues === undefined) return callback && callback();

            const value = res.formValues[0] as string ?? "";

            try {
                TapperNPC.setNameTag(entity, value);
                callback && callback();
            } catch(err: any) {
                player.sendMessage("§c" + err.message);
            }
        });
    }

    export async function ActionSearchForm(title: string, options: string[], player: Player, search?: string): Promise<number> {
        const form = new ActionFormData();

        form.title(title);
        form.body( search ? `Searching: ${search}` : "");
        form.button("§bSearch", "textures/ui/magnifying_glass");

        const _options = Array.from(options.entries()).filter(([i, v]) => search?.trim() ? v.toLowerCase().includes(search.toLowerCase()) : true);

        for (const [i, option] of _options) {
            form.button(option);
        }

        form.button("§8[ §c CANCEL §8]", "textures/blocks/barrier");

        try {
            const result = await form.show(player as any);
            if (result.selection === undefined || result.selection > _options.length) return -1;

            if (result.selection === 0) {
                const searchValue = await SearchForm(player, search);
                return ActionSearchForm(title, options, player, searchValue);
            }

            return _options[result.selection - 1][0];
        } catch(err) {
            return -1;
        }
    }

    export async function SearchForm(player: Player, defaultValue?: string): Promise<string|undefined> {
        const form = new ModalFormData();

        form.title("§gSearching Form");
        form.textField("Search:", "Search Keywords", { defaultValue });

        try {
            const result = await form.show(player as any);
            if (result.formValues === undefined) return undefined;

            const value = result.formValues[0] as string;

            return value.trim();
        } catch(err) {
            return undefined;
        }
    }

    export async function changeSkin(entity: Entity, player: Player, callback?: () => void) {
        const skins = Object.values(TapperNPC.skins);

        const selected = await ActionSearchForm('§6TapperNPC: §dChange Skin', skins, player);
        if (selected < 0) return callback && callback();

        try {
            TapperNPC.setSkin(entity, Object.keys(TapperNPC.skins)[selected]);
            callback && callback();
        } catch(err: any) {
            player.sendMessage("§c" + err.message);
        }
    }

    export async function changeCape(entity: Entity, player: Player, callback?: () => void) {
        const capes = Object.values(TapperNPC.capes);

        const selected = await ActionSearchForm('§6TapperNPC: §dChange Cape', capes, player);
        if (selected < 0) return callback && callback();

        try {
            TapperNPC.setCape(entity, Object.keys(TapperNPC.capes)[selected]);
            callback && callback();
        } catch(err: any) {
            player.sendMessage("§c" + err.message);
        }
    }

    export async function changeModel(entity: Entity, player: Player, callback?: () => void) {
        const models = Object.values(TapperNPC.models);

        const selected = await ActionSearchForm('§6TapperNPC: §dChange Model', models, player);
        if (selected < 0) return callback && callback();

        try {
            TapperNPC.setModel(entity, Object.keys(TapperNPC.models)[selected]);
            callback && callback();
        } catch(err: any) {
            player.sendMessage("§c" + err.message);
        }
    }

    export namespace Actions {

        export function main(entity: Entity, player: Player, callback?: () => void) {
            const actions = TapperNPC.getActions(entity);
            const form = new ActionFormData();

            form.title('§6TapperNPC: §dActions');
            form.body(`Commands that will be executed when used\nLength: ${actions.length}`);

            for (const [index, action] of actions.entries()) {
                const text = `§a${index}: §b${action.command.substring(0, 15)}${action.command.length > 15 ? '...' : ''}\n§r§d${action.actor}: §2${!action.conditional ? '§6un' : ''}conditional`;

                form.button(text);
            }

            form.button(`§bAdd Action`, "textures/ui/color_plus");
            form.button(`§8[ §c${ callback ? `BACK` : `CLOSE`} §8]`, "textures/blocks/barrier");

            form.show(player as any).then((res) => {
                if (res.selection === undefined || res.selection === actions.length + 1) return callback && callback();
                if (res.selection === actions.length) return addAction(entity, player, () => main(entity, player, callback));

                manageAction(entity, player, res.selection, () => main(entity, player, callback));
            });
        }

        export async function ActionForm(player: Player, options?: Partial<TapperAction>): Promise<TapperAction|undefined> {
            const form = new ModalFormData();

            form.title('§6TapperNPC: §dActionForm');
            form.dropdown("Actor", [ "Player", "Server" ], { defaultValueIndex: options?.actor === "server" ? 1 : 0 });
            form.textField("Command", "give @s apple", { defaultValue: options?.command, tooltip: "Minecraft command to be run. You can use {player} to replace the player name." });
            form.toggle("Conditional", { defaultValue: options?.conditional, tooltip: "Only run if the previous command was successful. Does not affect for first command." });

            try {
                const result = await form.show(player as any);
                if (result.formValues === undefined) return undefined;

                const actor = result.formValues[0] === 1 ? "server" : "player";
                const command = result.formValues[1] as string;
                const conditional = result.formValues.length === 3 ? result.formValues[2] as boolean : false;

                return {
                    actor,
                    command,
                    conditional
                };
            } catch(err) {
                return undefined;
            }
        }

        export async function addAction(entity: Entity, player: Player, callback?: () => void) {
            try {
                const action = await ActionForm(player);
                if (!action) return callback && callback();

                TapperNPC.addAction(entity, action);
                callback && callback();
            } catch(err: any) {
                player.sendMessage("§c" + err.message);
            }
        }

        export function manageAction(entity: Entity, player: Player, targetIndex: number, callback?: () => void) {
            const action = TapperNPC.getAction(entity, targetIndex);
            if (!action) return callback && callback();

            const form = new ActionFormData();
            const description = `TapperNPC:\n - "${TapperNPC.getNameTag(entity)}§r"\n\nIndex:\n - §a${targetIndex}§r\nActor:\n - §d${action.actor}§r\nCommand:\n - "${action.command}§r"\nConditional:\n - §a${action.conditional}§r\n\n`;

            form.title('§6TapperNPC: §dAction');
            form.body(description);
            form.button('§dEdit Action', 'textures/ui/editIcon');
            form.button('§dMove Up', 'textures/ui/up_arrow');
            form.button('§dMove Down', 'textures/ui/down_arrow');
            form.button('§4DELETE', 'textures/ui/trash');
            form.button(`§8[ §c${ callback ? `BACK` : `CLOSE`} §8]`, "textures/blocks/barrier");

            form.show(player as any).then((res) => {
                if (res.selection === 0) return editAction(entity, player, targetIndex, () => manageAction(entity, player, targetIndex, callback));

                if (res.selection === 1) {
                    try {
                        TapperNPC.moveAction(entity, "up", targetIndex);
                        callback && callback();
                    } catch(err: any) {
                        player.sendMessage("§c" + err.message);
                    }

                    return;
                }

                if (res.selection === 2) {
                    try {
                        TapperNPC.moveAction(entity, "down", targetIndex);
                        callback && callback();
                    } catch(err: any) {
                        player.sendMessage("§c" + err.message);
                    }
                    
                    return;
                }

                if (res.selection === 3) return deleteAction(entity, player, targetIndex, callback);
                if (res.selection === 4 && callback) return callback();
            });
        }

        export async function editAction(entity: Entity, player: Player, targetIndex: number, callback?: () => void) {
            try {
                const action = TapperNPC.getAction(entity, targetIndex);
                if (!action) return callback && callback();

                const newaction = await ActionForm(player, action);
                if (!newaction) return callback && callback();

                TapperNPC.updateAction(entity, targetIndex, newaction);
                callback && callback();
            } catch(err: any) {
                player.sendMessage("§c" + err.message);
            }
        }

        export async function deleteAction(entity: Entity, player: Player, targetIndex: number, callback?: () => void) {
            const action = TapperNPC.getAction(entity, targetIndex);
            if (!action) return callback && callback();

            const form = new ActionFormData();
            const description = `§cAre you sure wanna delete this action?§r\n\nTapperNPC:\n - "${TapperNPC.getNameTag(entity)}§r"\n\nIndex:\n - §a${targetIndex}§r\nActor:\n - §d${action.actor}§r\nCommand:\n - "${action.command}§r"\nConditional:\n - §a${action.conditional}§r\n\n`;

            form.title('§6TapperNPC: §cDELETE');
            form.body(description);
            form.button('§4DELETE', 'textures/ui/trash');
            form.button(`§8[ §c${ callback ? `BACK` : `CLOSE`} §8]`, "textures/blocks/barrier");
            
            form.show(player as any).then((res) => {
                if (res.selection === 0) {
                    try {
                        TapperNPC.removeAction(entity, targetIndex);
                        callback && callback();
                    } catch(err: any) {
                        player.sendMessage("§c" + err.message);
                    }
                }
                if (res.selection === 1 && callback) callback();
            });
        }
    }
}

export default TapperUI;