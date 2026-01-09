export interface AssetTemplateItem {
    name: string;
    criticality: 'A' | 'B' | 'C';
    type: string;
    description?: string;
    children?: AssetTemplateItem[];
}

export interface AssetTemplate {
    id: string;
    name: string;
    industry: string;
    description: string;
    icon: string;
    structure: AssetTemplateItem[];
}

export const ASSET_TEMPLATES: AssetTemplate[] = [
    {
        id: 'manufacturing',
        name: 'Industrial Manufacturing',
        industry: 'Industrial',
        icon: 'Factory',
        description: 'Standard production line hierarchy focusing on business-critical machinery and replaceable components.',
        structure: [
            {
                name: 'Main Production Line',
                type: 'Line',
                criticality: 'A',
                description: 'Primary conveyor and assembly line.',
                children: [
                    {
                        name: 'CNC Milling Station',
                        type: 'Machine',
                        criticality: 'A',
                        description: 'Precision carving unit.',
                        children: [
                            { name: 'Spindle Motor', type: 'Component', criticality: 'B' },
                            { name: 'Coolant Pump', type: 'Component', criticality: 'C' }
                        ]
                    },
                    {
                        name: 'Industrial Robot Arm',
                        type: 'Machine',
                        criticality: 'A',
                        children: [
                            { name: 'Hydraulic Actuator', type: 'Component', criticality: 'B' },
                            { name: 'End Effector', type: 'Component', criticality: 'C' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'facilities',
        name: 'Facilities & Building',
        industry: 'Facilities',
        icon: 'Building',
        description: 'Ideal for property management, focusing on HVAC, life safety, and utility systems.',
        structure: [
            {
                name: 'Main Office Building',
                type: 'Building',
                criticality: 'B',
                children: [
                    {
                        name: 'Primary HVAC System',
                        type: 'System',
                        criticality: 'A',
                        children: [
                            { name: 'Chiller Unit', type: 'Component', criticality: 'A' },
                            { name: 'Air Handling Unit 1', type: 'Component', criticality: 'B' },
                            { name: 'Air Filters', type: 'Component', criticality: 'C' }
                        ]
                    },
                    {
                        name: 'Backup Generator',
                        type: 'System',
                        criticality: 'A',
                        children: [
                            { name: 'Diesel Engine', type: 'Component', criticality: 'A' },
                            { name: 'Fuel Transfer Pump', type: 'Component', criticality: 'B' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'food-tech',
        name: 'Food Tech & Lab',
        industry: 'Food/Pharma',
        icon: 'FlaskConical',
        description: 'Strict hierarchy for clean rooms, pasteurization, and temperature-controlled storage.',
        structure: [
            {
                name: 'Processing Zone A',
                type: 'Zone',
                criticality: 'A',
                children: [
                    {
                        name: 'Flash Pasteurizer',
                        type: 'Equipment',
                        criticality: 'A',
                        children: [
                            { name: 'Heat Exchanger', type: 'Component', criticality: 'A' },
                            { name: 'Digital Flow Meter', type: 'Component', criticality: 'B' }
                        ]
                    },
                    {
                        name: 'Cold Storage Module',
                        type: 'Equipment',
                        criticality: 'B',
                        children: [
                            { name: 'Refrigeration Unit', type: 'Component', criticality: 'A' },
                            { name: 'Door Gasket System', type: 'Component', criticality: 'C' }
                        ]
                    }
                ]
            }
        ]
    }
];
