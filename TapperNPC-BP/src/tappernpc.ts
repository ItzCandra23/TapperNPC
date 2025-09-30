import { Dimension, Entity, GameMode, Player, PlayerPermissionLevel, system, Vector3, world } from "@minecraft/server";
import TapperSkins from "./skins";
import TapperCapes from "./capes";
import TapperModels from "./models";
import TapperUI from "./tapperui";

export interface TapperAction {
    actor: "player"|"server";
    command: string;
    conditional: boolean;
}

const cooldown = new Map<string, number>();

namespace TapperNPC {

    export function spawnTapperNPC(
        dimension: Dimension,
        location: Vector3,
        options?: {
            nameTag?: string;
            skinId?: string;
            actions?: TapperAction[];
        }
    ): Entity {
        try {
            const entity = dimension.spawnEntity(entityId, location, {
                spawnEvent: options?.skinId
            });

            if (options?.nameTag?.trim()) TapperNPC.setNameTag(entity, options.nameTag);
            if (options?.actions?.length) TapperNPC.setActions(entity, options.actions);

            return entity;
        } catch(err) {
            throw new Error("Failed to spawn!");
        }
    }

    export const entityId = "tappernpc:dummy";

    export const models = TapperModels;
    export const skins = TapperSkins;
    export const capes = TapperCapes;

    export function setModel(tapper: Entity, modelId: string): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");
        if (!models.hasOwnProperty(modelId)) throw new Error("Model id not found!");

        try {
            tapper.triggerEvent(modelId);
        } catch(err) {
            throw new Error("Failed to change model!");
        }
    }

    export function setSkin(tapper: Entity, skinId: string): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");
        if (!skins.hasOwnProperty(skinId)) throw new Error("Skin id not found!");

        try {
            tapper.triggerEvent(skinId);
        } catch(err) {
            throw new Error("Failed to change skin!");
        }
    }

    export function setCape(tapper: Entity, capeId: string): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");
        if (!capes.hasOwnProperty(capeId)) throw new Error("Cape id not found!");

        try {
            tapper.triggerEvent(capeId);
        } catch(err) {
            throw new Error("Failed to change cape!");
        }
    }

    export function getNameTag(tapper: Entity): string {
        return tapper.nameTag.replaceAll("\n", "\\n");
    }

    export function setNameTag(tapper: Entity, nameTag: string): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");

        if (!nameTag.trim()) tapper.nameTag = "";
        tapper.nameTag = nameTag.replaceAll("\\n", "\n");
    }

    export function getActions(tapper: Entity): TapperAction[] {
        const rawactions = tapper.getDynamicProperty("tappernpc:actions") as string | undefined;
        return rawactions ? JSON.parse(rawactions) : [];
    }

    export function getAction(tapper: Entity, index: number): TapperAction|undefined {
        const actions = getActions(tapper);
        return (index < 0 || index >= actions.length) ? undefined : actions[index];
    }

    export function setActions(tapper: Entity, actions: TapperAction[]): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");
        
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }

    export function addAction(tapper: Entity, action: TapperAction): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");

        let actions = getActions(tapper);

        actions.push(action);
        
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }

    export function removeAction(tapper: Entity, index: number): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");
        
        let actions = getActions(tapper);
        if (index < 0 || index >= actions.length) throw new Error("Action not found!");

        actions = actions.filter((v, i) => i !== index);
        
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }

    export function updateAction(tapper: Entity, index: number, action: Partial<TapperAction>): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");
        
        let actions = getActions(tapper);
        if (index < 0 || index >= actions.length) throw new Error("Action not found!");

        actions[index] = {
            actor: action.actor ?? actions[index].actor,
            command: action.command ?? actions[index].command,
            conditional: action.conditional ?? actions[index].conditional,
        };
        
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }

    export function moveAction(tapper: Entity, direction: "up"|"down", target: number): void {
        if (tapper.typeId !== entityId) throw new Error("Invalid entity id!");
        
        let actions = getActions(tapper);
        const actionsLength = actions.length;

        if (target < 0 || target >= actionsLength) throw new Error("Action not found!");

        const newArr = actions;
        if (direction === 'up' && target > 0) {
            [newArr[target], newArr[target - 1]] = [newArr[target - 1], newArr[target]];
        } else if (direction === 'down' && target < actionsLength - 1) {
            [newArr[target], newArr[target + 1]] = [newArr[target + 1], newArr[target]];
        }

        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(newArr));
    }

    export function runAction(player: Player, actions: TapperAction[]): void {
        const dimension = player.dimension;
        let condition = true;

        for (const action of actions) {
            if (!condition && action.conditional) continue;

            try {
                condition = !!((action.actor === "server" ? dimension : player).runCommand(action.command.replaceAll("{player}", player.name)).successCount);
            } catch(err) { condition = false; }
        }
    }

    export function useTapper(tapper: Entity, player: Player): void {
        const actions: TapperAction[] = getActions(tapper);

        runAction(player, actions);
    }

    export function onInteract(tapper: Entity, player: Player) {
        const now = Date.now();

        if (now - (cooldown.get(player.id) ?? 0) < 1000) return;

        cooldown.set(player.id, now);

        system.run(() => {
            if (
                player.isSneaking && 
                player.getGameMode() === GameMode.Creative && 
                player.playerPermissionLevel === PlayerPermissionLevel.Operator
            ) {
                TapperUI.manage(tapper, player);
            } else TapperNPC.useTapper(tapper, player);
        });
    }
}

export default TapperNPC;

world.afterEvents.playerInteractWithEntity.subscribe(({ target, player }) => {
    if (target.typeId === TapperNPC.entityId) TapperNPC.onInteract(target, player);
});

world.afterEvents.entityHitEntity.subscribe(({ hitEntity, damagingEntity }) => {
    if (hitEntity.typeId === TapperNPC.entityId && damagingEntity instanceof Player) TapperNPC.onInteract(hitEntity, damagingEntity);
});

world.afterEvents.projectileHitEntity.subscribe((ev) => {
    if (ev.getEntityHit().entity?.typeId === TapperNPC.entityId && ev.projectile.typeId === "minecraft:fishing_hook") ev.projectile.remove();
});