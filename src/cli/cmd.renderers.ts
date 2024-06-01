import { Command } from "commander";
import { supportedRenderers } from "../lib/renderers/index.js";

export default function RenderersCommand(program: Command) {
    const root = program
        .command("renderers")
        .description("Manage renderers - These are the engines you can select from that synthesize your emails from templates and contacts.")

    root.command("list")
        .description("List all renderers.")
        .action(displayRenderers)
}

const displayRenderers = async () => {
    console.table(Object.entries(supportedRenderers).map(([tag, info]) => ({
        TAG: tag,
        NAME: info.name,
        DESCRIPTION: info.description.split("\n")[0],
        ALIASES: [tag, ...(info.aliases ?? [])].join(", ")
    })));
}

