import { PrismaClient } from '@prisma/client';
import { AssetService } from './asset.service';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedAsset {
    name: string;
    criticality: 'A' | 'B' | 'C';
    type: string;
    description: string;
    tags: string[];
    location: string | null;
    children: ParsedAsset[];
}

export class AssetImporterService {
    constructor(
        private prisma: PrismaClient,
        private assetService: AssetService
    ) { }

    /**
     * Parses the DSL text into a hierarchical structure.
     */
    parseDSL(text: string): ParsedAsset[] {
        if (!text || text.trim().length === 0) return [];
        const lines = text.split(/\r?\n/);
        const roots: ParsedAsset[] = [];
        const stack: { level: number; asset: ParsedAsset }[] = [];

        // Detect indentation step
        let indentStep = 4;
        for (const line of lines) {
            const match = line.match(/^(\s+)/);
            if (match && match[1].length > 0) {
                if (match[1].includes('\t')) {
                    indentStep = 1;
                    break;
                }
                if (match[1].length < 4) {
                    indentStep = match[1].length;
                    break;
                }
            }
        }

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0 || trimmedLine.startsWith('//')) return;

            const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
            let level = 0;
            if (leadingWhitespace.includes('\t')) {
                level = leadingWhitespace.length;
            } else {
                level = Math.floor(leadingWhitespace.length / indentStep);
            }

            const parsed = this.parseLine(trimmedLine);

            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                roots.push(parsed);
            } else {
                stack[stack.length - 1].asset.children.push(parsed);
            }

            stack.push({ level, asset: parsed });
        });

        return roots;
    }

    private parseLine(content: string): ParsedAsset {
        let description = '';
        const descMatch = content.match(/\/\/(.*)$/);
        if (descMatch) {
            description = descMatch[1].trim();
            content = content.replace(/\/\/(.*)$/, '').trim();
        }

        let criticality: 'A' | 'B' | 'C' = 'C';
        const critMatch = content.match(/^\[([ABC])\]/i);
        if (critMatch) {
            criticality = critMatch[1].toUpperCase() as 'A' | 'B' | 'C';
            content = content.replace(/^\[([ABC])\]/i, '').trim();
        }

        let location: string | null = null;
        const locMatch = content.match(/@\s*"([^"]+)"/);
        if (locMatch) {
            location = locMatch[1];
            content = content.replace(/@\s*"([^"]+)"/, '').trim();
        }

        let type = 'Equipment';
        const typeMatch = content.match(/::([\w-]+)/);
        if (typeMatch) {
            type = typeMatch[1];
            content = content.replace(/::([\w-]+)/, '').trim();
        }

        const tags: string[] = [];
        const tagRegex = /#([\w-]+)/g;
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }
        content = content.replace(/#([\w-]+)/g, '').trim();

        const name = content || 'Unnamed Asset';

        return { name, criticality, type, description, tags, location, children: [] };
    }

    async importBulk(tenantId: string, text: string) {
        const hierarchy = this.parseDSL(text);

        return await this.prisma.$transaction(async (tx) => {
            const createRecursive = async (parsed: ParsedAsset, parentId: string | null = null) => {
                const id = uuidv4();
                let hierarchyPath = `/${id}`;

                if (parentId) {
                    const parent = await tx.asset.findUnique({ where: { id: parentId } });
                    if (parent) {
                        const parentPath = parent.hierarchyPath === '/' ? `/${parent.id}` : parent.hierarchyPath;
                        hierarchyPath = `${parentPath}/${id}`;
                    }
                }

                const asset = await tx.asset.create({
                    data: {
                        id,
                        tenantId,
                        name: parsed.name,
                        // 'type' doesn't exist on model, store in metadata
                        criticality: parsed.criticality,
                        description: parsed.description,
                        parentId: parentId,
                        hierarchyPath,
                        status: 'OPERATIONAL',
                        metadata: {
                            type: parsed.type,
                            tags: parsed.tags,
                            location: parsed.location
                        } as any
                    }
                });

                for (const child of parsed.children) {
                    await createRecursive(child, asset.id);
                }

                return asset;
            };

            const results: any[] = [];
            for (const root of hierarchy) {
                results.push(await createRecursive(root));
            }
            return results;
        });
    }
}
