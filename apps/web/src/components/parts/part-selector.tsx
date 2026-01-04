"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PackageSearch } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { PartService, Part } from "@/services/part.service";

interface PartSelectorProps {
    onSelect: (part: Part) => void;
}

export function PartSelector({ onSelect }: PartSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState("");

    const { data: parts, isLoading } = useQuery({
        queryKey: ["parts"],
        queryFn: PartService.getAll
    });

    const safeParts = parts || [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2">
                        <PackageSearch className="h-4 w-4 opacity-50" />
                        <span>Search parts to add...</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search parts by name or SKU..." />
                    <CommandList>
                        <CommandEmpty>No parts found.</CommandEmpty>
                        <CommandGroup>
                            {safeParts.map((part) => (
                                <CommandItem
                                    key={part.id}
                                    value={part.name}
                                    onSelect={(currentValue: string) => {
                                        // Reset component state to allow selecting another
                                        setValue("");
                                        setOpen(false);
                                        onSelect(part);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === part.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{part.name}</span>
                                        <span className="text-xs text-muted-foreground flex gap-2">
                                            {part.sku && <span>SKU: {part.sku}</span>}
                                            <span className={part.quantity <= 0 ? "text-red-500 font-bold" : ""}>
                                                Qty: {part.quantity}
                                            </span>
                                            <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: part.currency || 'GBP' }).format(part.cost)}</span>
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
