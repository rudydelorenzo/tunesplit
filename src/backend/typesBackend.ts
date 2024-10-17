import { SPLITTING_MODES } from "./constants.js";

export type MessageType = ProgressMessageType | SeparationTypeMessageType;

export type ProgressMessageType = {
    type: "progress";
    progress: number;
};

export type SeparationTypeMessageType = {
    type: 'stems'
    data: keyof typeof SPLITTING_MODES;
}