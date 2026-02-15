// ─── Protocol Message Validation (Ajv) ───

import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import * as protocolSchema from '../../../specs/protocol/remoteops-message.schema.json';
import * as macroSchema from '../../../specs/macros/macro.schema.json';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validateProtocolMessage = ajv.compile(protocolSchema);
const validateMacro = ajv.compile(macroSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMessage(msg: unknown): ValidationResult {
  const valid = validateProtocolMessage(msg) as boolean;
  return {
    valid,
    errors: valid
      ? []
      : (validateProtocolMessage.errors ?? []).map(
          (e: { instancePath?: string; message?: string }) =>
            `${e.instancePath || '/'} ${e.message ?? 'unknown error'}`,
        ),
  };
}

export function validateMacroDefinition(macro: unknown): ValidationResult {
  const valid = validateMacro(macro) as boolean;
  return {
    valid,
    errors: valid
      ? []
      : (validateMacro.errors ?? []).map(
          (e: { instancePath?: string; message?: string }) =>
            `${e.instancePath || '/'} ${e.message ?? 'unknown error'}`,
        ),
  };
}
