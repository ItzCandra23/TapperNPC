import { CommandPermissionLevel, CustomCommandOrigin, CustomCommandParamType, CustomCommandSource, CustomCommandStatus, Dimension, Player, system, Vector3, world } from "@minecraft/server";
import TapperNPC from "./tappernpc";
import TapperUI from "./tapperui";

system.beforeEvents.startup.subscribe((ev) => {
    const customCommand = ev.customCommandRegistry;

    function onRunCommand(o: CustomCommandOrigin, nameTag?: string, location?: Vector3, dimensionId?: string) {
        const pos: Vector3|undefined = location ?? (o.sourceEntity ?? o.sourceBlock)?.location;
        const dimension: Dimension|undefined = dimensionId ? world.getDimension(dimensionId) : (o.sourceEntity ?? o.sourceBlock)?.dimension;

        if (!pos || !dimension) return {
            status: CustomCommandStatus.Failure,
            message: "Location not found!",
        };
        
        system.run(() => {
            try {
                const entity = TapperNPC.spawnTapperNPC(dimension, pos, { nameTag: nameTag });

                if (o.sourceEntity instanceof Player) {
                    TapperUI.manage(entity, o.sourceEntity);
                    o.sourceEntity.sendMessage("§aTapperNPC spawned! Sneaking and interact with creative mode to manage the npc.");
                }
                
                // return {
                //     status: CustomCommandStatus.Success,
                //     message: "TapperNPC spawned! Sneaking and interact with creative mode to manage the npc.",
                // };
            } catch(err: any) {
                if (o.sourceEntity instanceof Player && err.message) {
                    o.sourceEntity.sendMessage("§c" + err.message);
                }
                // return {
                //     status: CustomCommandStatus.Failure,
                //     message: err.message,
                // };
            }
        });
    }

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
    }, onRunCommand);

    try {
        customCommand.registerCommand({
            name: "tappernpc:spawnnpc",
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
        }, onRunCommand);
    } catch(err) {}
});