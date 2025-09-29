import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system, world } from "@minecraft/server";
import TapperNPC from "./tappernpc";
system.beforeEvents.startup.subscribe((ev) => {
    const customCommand = ev.customCommandRegistry;
    customCommand.registerEnum("tappernpc:dimensionId", [
        "overworld",
        "nether",
        "the_end",
        "minecraft:overworld",
        "minecraft:nether",
        "minecraft:the_end",
    ]);
    customCommand.registerCommand({
        name: "tappernpc:tappernpc",
        description: "Spawn tappernpc.",
        permissionLevel: CommandPermissionLevel.GameDirectors,
        optionalParameters: [
            {
                name: "name",
                type: CustomCommandParamType.String,
            },
            {
                name: "location",
                type: CustomCommandParamType.Location,
            },
            {
                name: "tappernpc:dimensionId",
                type: CustomCommandParamType.Enum,
            },
        ]
    }, (o, nameTag, location, dimensionId) => {
        const pos = location ?? (o.sourceEntity ?? o.sourceBlock)?.location;
        const dimension = dimensionId ? world.getDimension(dimensionId) : (o.sourceEntity ?? o.sourceBlock)?.dimension;
        if (!pos || !dimension)
            return {
                status: CustomCommandStatus.Failure,
                message: "Location not found!",
            };
        system.run(() => {
            try {
                TapperNPC.spawnTapperNPC(dimension, pos, { nameTag: nameTag });
                return {
                    status: CustomCommandStatus.Success,
                    message: "TapperNPC spawned! Sneaking and interact with creative mode to manage the npc.",
                };
            }
            catch (err) {
                return {
                    status: CustomCommandStatus.Failure,
                    message: err.message,
                };
            }
        });
    });
});
