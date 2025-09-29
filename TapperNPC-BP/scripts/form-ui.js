import { TapperNPC } from "./tappernpc";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
var TapperUI;
(function (TapperUI) {
    function manage(entity, player, callback) {
        if (entity.typeId !== TapperNPC.entityId)
            return;
        const form = new ActionFormData();
        form.title("§6TapperNPC");
        form.button("§dManage Actions", "textures/ui/ImpulseSquare");
        form.button("§dEdit Nametag", "textures/ui/hanging_sign_jungle");
        form.button("§dChange Skin", "textures/ui/sidebar_icons/classic_skins");
        form.button("§dChange Cape", "textures/ui/sidebar_icons/capes");
        form.button("§dChange Model", "textures/ui/sidebar_icons/dr_body");
        form.button(`§8[ §c${callback ? `BACK` : `CLOSE`} §8]`, "textures/blocks/barrier");
        form.show(player).then((res) => {
            if (res.selection === undefined)
                return;
            if (res.selection === 1)
                return editNameTag(entity, player, () => manage(entity, player, callback));
            if (res.selection === 2)
                return changeSkin(entity, player, () => manage(entity, player, callback));
            if (res.selection === 3)
                return changeCape(entity, player, () => manage(entity, player, callback));
            if (res.selection === 4)
                return changeModel(entity, player, () => manage(entity, player, callback));
            if (res.selection === 5 && callback)
                return callback();
        });
    }
    TapperUI.manage = manage;
    function editNameTag(entity, player, callback) {
        if (entity.typeId !== TapperNPC.entityId)
            return;
        const form = new ModalFormData();
        form.title("§6TapperNPC: §eNameTag");
        form.textField("NameTag", "Shop NPC", {
            defaultValue: TapperNPC.getNameTag(entity),
            tooltip: "The display nametag of npc. Empty the nametag for hide",
        });
        form.show(player).then((res) => {
            if (res.formValues === undefined)
                return callback && callback();
            const value = res.formValues[0] ?? "";
            try {
                TapperNPC.setNameTag(entity, value);
                callback && callback();
            }
            catch (err) {
                player.sendMessage("§c" + err.message);
            }
        });
    }
    TapperUI.editNameTag = editNameTag;
    async function ActionSearchForm(title, options, player, search) {
        const form = new ActionFormData();
        form.title(title);
        form.body(search ? `Searching: ${search}` : "");
        form.button("§bSearch", "textures/ui/magnifying_glass");
        const _options = Array.from(options.entries()).filter(([i, v]) => search?.trim() ? v.toLowerCase().includes(search.toLowerCase()) : true);
        for (const [i, option] of _options) {
            form.button(option);
        }
        form.button("§8[ §c CANCEL §8]", "textures/blocks/barrier");
        try {
            const result = await form.show(player);
            if (result.selection === undefined || result.selection >= _options.length)
                return -1;
            if (result.selection === 0) {
                const searchValue = await SearchForm(player, search);
                return ActionSearchForm(title, options, player, searchValue);
            }
            return result.selection - 1;
        }
        catch (err) {
            return -1;
        }
    }
    TapperUI.ActionSearchForm = ActionSearchForm;
    async function SearchForm(player, defaultValue) {
        const form = new ModalFormData();
        form.title("§gSearching Form");
        form.textField("Search:", "Search Keywords", { defaultValue });
        try {
            const result = await form.show(player);
            if (result.formValues === undefined)
                return undefined;
            const value = result.formValues[0];
            return value.trim();
        }
        catch (err) {
            return undefined;
        }
    }
    TapperUI.SearchForm = SearchForm;
    async function changeSkin(entity, player, callback) {
        const skins = Object.values(TapperNPC.skins);
        const selected = await ActionSearchForm('§6TapperNPC: §eChange Skin', skins, player);
        if (selected < 0)
            return callback && callback();
        try {
            TapperNPC.setSkin(entity, Object.keys(TapperNPC.skins)[selected]);
            callback && callback();
        }
        catch (err) {
            player.sendMessage("§c" + err.message);
        }
    }
    TapperUI.changeSkin = changeSkin;
    async function changeCape(entity, player, callback) {
        const capes = Object.values(TapperNPC.capes);
        const selected = await ActionSearchForm('§6TapperNPC: §eChange Cape', capes, player);
        if (selected < 0)
            return callback && callback();
        try {
            TapperNPC.setCape(entity, Object.keys(TapperNPC.capes)[selected]);
            callback && callback();
        }
        catch (err) {
            player.sendMessage("§c" + err.message);
        }
    }
    TapperUI.changeCape = changeCape;
    async function changeModel(entity, player, callback) {
        const models = Object.values(TapperNPC.models);
        const selected = await ActionSearchForm('§6TapperNPC: §eChange Model', models, player);
        if (selected < 0)
            return callback && callback();
        try {
            TapperNPC.setModel(entity, Object.keys(TapperNPC.models)[selected]);
            callback && callback();
        }
        catch (err) {
            player.sendMessage("§c" + err.message);
        }
    }
    TapperUI.changeModel = changeModel;
})(TapperUI || (TapperUI = {}));
export default TapperUI;
