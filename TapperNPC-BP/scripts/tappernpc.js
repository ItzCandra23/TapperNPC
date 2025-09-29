import { GameMode, Player, PlayerPermissionLevel, system, world } from "@minecraft/server";
import TapperSkins from "./skins";
import TapperCapes from "./capes";
import TapperModels from "./models";
import TapperUI from "./tapperui";
const cooldown = new Map();
var TapperNPC;
(function (TapperNPC) {
    function spawnTapperNPC(dimension, location, options) {
        try {
            const entity = dimension.spawnEntity(TapperNPC.entityId, location, {
                spawnEvent: options?.skinId
            });
            if (options?.nameTag?.trim())
                TapperNPC.setNameTag(entity, options.nameTag);
            if (options?.actions?.length)
                TapperNPC.setActions(entity, options.actions);
        }
        catch (err) {
            throw new Error("Failed to spawn!");
        }
    }
    TapperNPC.spawnTapperNPC = spawnTapperNPC;
    TapperNPC.entityId = "tappernpc:dummy";
    TapperNPC.models = TapperModels;
    TapperNPC.skins = TapperSkins;
    TapperNPC.capes = TapperCapes;
    function setModel(tapper, modelId) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        if (!TapperNPC.models.hasOwnProperty(modelId))
            throw new Error("Model id not found!");
        try {
            tapper.triggerEvent(modelId);
        }
        catch (err) {
            throw new Error("Failed to change model!");
        }
    }
    TapperNPC.setModel = setModel;
    function setSkin(tapper, skinId) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        if (!TapperNPC.skins.hasOwnProperty(skinId))
            throw new Error("Skin id not found!");
        try {
            tapper.triggerEvent(skinId);
        }
        catch (err) {
            throw new Error("Failed to change skin!");
        }
    }
    TapperNPC.setSkin = setSkin;
    function setCape(tapper, capeId) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        if (!TapperNPC.capes.hasOwnProperty(capeId))
            throw new Error("Cape id not found!");
        try {
            tapper.triggerEvent(capeId);
        }
        catch (err) {
            throw new Error("Failed to change cape!");
        }
    }
    TapperNPC.setCape = setCape;
    function getNameTag(tapper) {
        return tapper.nameTag.replaceAll("\n", "\\n");
    }
    TapperNPC.getNameTag = getNameTag;
    function setNameTag(tapper, nameTag) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        if (!nameTag.trim())
            tapper.nameTag = "";
        tapper.nameTag = nameTag.replaceAll("\\n", "\n");
    }
    TapperNPC.setNameTag = setNameTag;
    function getActions(tapper) {
        const rawactions = tapper.getDynamicProperty("tappernpc:actions");
        return rawactions ? JSON.parse(rawactions) : [];
    }
    TapperNPC.getActions = getActions;
    function getAction(tapper, index) {
        const actions = getActions(tapper);
        return (index < 0 || index >= actions.length) ? undefined : actions[index];
    }
    TapperNPC.getAction = getAction;
    function setActions(tapper, actions) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }
    TapperNPC.setActions = setActions;
    function addAction(tapper, action) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        let actions = getActions(tapper);
        actions.push(action);
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }
    TapperNPC.addAction = addAction;
    function removeAction(tapper, index) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        let actions = getActions(tapper);
        if (index < 0 || index >= actions.length)
            throw new Error("Action not found!");
        actions = actions.filter((v, i) => i !== index);
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }
    TapperNPC.removeAction = removeAction;
    function updateAction(tapper, index, action) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        let actions = getActions(tapper);
        if (index < 0 || index >= actions.length)
            throw new Error("Action not found!");
        actions[index] = {
            actor: action.actor ?? actions[index].actor,
            command: action.command ?? actions[index].command,
            conditional: action.conditional ?? actions[index].conditional,
        };
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(actions));
    }
    TapperNPC.updateAction = updateAction;
    function moveAction(tapper, direction, target) {
        if (tapper.typeId !== TapperNPC.entityId)
            throw new Error("Invalid entity id!");
        let actions = getActions(tapper);
        const actionsLength = actions.length;
        if (target < 0 || target >= actionsLength)
            throw new Error("Action not found!");
        const newArr = actions;
        if (direction === 'up' && target > 0) {
            [newArr[target], newArr[target - 1]] = [newArr[target - 1], newArr[target]];
        }
        else if (direction === 'down' && target < actionsLength - 1) {
            [newArr[target], newArr[target + 1]] = [newArr[target + 1], newArr[target]];
        }
        tapper.setDynamicProperty("tappernpc:actions", JSON.stringify(newArr));
    }
    TapperNPC.moveAction = moveAction;
    function runAction(player, actions) {
        const dimension = player.dimension;
        let condition = true;
        for (const action of actions) {
            if (!condition && action.conditional)
                continue;
            try {
                condition = !!((action.actor === "server" ? dimension : player).runCommand(action.command.replaceAll("{player}", player.name)).successCount);
            }
            catch (err) {
                condition = false;
            }
        }
    }
    TapperNPC.runAction = runAction;
    function useTapper(tapper, player) {
        const actions = getActions(tapper);
        runAction(player, actions);
    }
    TapperNPC.useTapper = useTapper;
    function onInteract(tapper, player) {
        const now = Date.now();
        if (now - (cooldown.get(player.id) ?? 0) < 1000)
            return;
        cooldown.set(player.id, now);
        system.run(() => {
            if (player.isSneaking &&
                player.getGameMode() === GameMode.Creative &&
                player.playerPermissionLevel === PlayerPermissionLevel.Operator) {
                TapperUI.manage(tapper, player);
            }
            else
                TapperNPC.useTapper(tapper, player);
        });
    }
    TapperNPC.onInteract = onInteract;
})(TapperNPC || (TapperNPC = {}));
export default TapperNPC;
world.afterEvents.playerInteractWithEntity.subscribe(({ target, player }) => {
    if (target.typeId === TapperNPC.entityId)
        TapperNPC.onInteract(target, player);
});
world.afterEvents.entityHitEntity.subscribe(({ hitEntity, damagingEntity }) => {
    if (hitEntity.typeId === TapperNPC.entityId && damagingEntity instanceof Player)
        TapperNPC.onInteract(hitEntity, damagingEntity);
});
world.afterEvents.projectileHitEntity.subscribe((ev) => {
    if (ev.getEntityHit().entity?.typeId === TapperNPC.entityId && ev.projectile.typeId === "minecraft:fishing_hook")
        ev.projectile.remove();
});
