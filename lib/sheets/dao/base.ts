import { getSheetsClient, getSpreadsheetId, getSheetName } from '../client';
import { generateId, now } from '../../ids';
import { cache, getCacheKey } from '../../cache';

export abstract class BaseDAO<T> {
  protected abstract entityName: string;
  protected abstract headers: string[];

  protected getSheetName(): string {
    return getSheetName(this.entityName);
  }

  protected async getHeaders(): Promise<string[]> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = this.getSheetName();

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!1:1`,
      });

      return response.data.values?.[0] || this.headers;
    } catch (error) {
      console.error(`Error getting headers for ${this.entityName}:`, error);
      return this.headers;
    }
  }

  protected async getAllRows(): Promise<T[]> {
    const cacheKey = `${this.entityName}:all`;
    const cached = cache.get<T[]>(cacheKey);
    if (cached) return cached;

    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = this.getSheetName();

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return []; // Only headers or empty

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const entities = dataRows.map(row => {
        const entity: any = {};
        headers.forEach((header, index) => {
          const value = row[index];
          if (value !== undefined && value !== '') {
            // Parse based on expected type
            if (header === 'version' || header === 'size' || header === 'estimate_hours') {
              entity[header] = parseInt(value) || 0;
            } else {
              entity[header] = value;
            }
          }
        });
        return entity as T;
      });

      cache.set(cacheKey, entities, 5 * 60 * 1000); // 5 minutes cache
      return entities;
    } catch (error) {
      console.error(`Error getting all rows for ${this.entityName}:`, error);
      throw new Error(`Failed to fetch ${this.entityName}`);
    }
  }

  protected async getRowById(id: string): Promise<T | null> {
    const cacheKey = `${this.entityName}:${id}`;
    const cached = cache.get<T>(cacheKey);
    if (cached) return cached;

    const entities = await this.getAllRows();
    const entity = entities.find((e: any) => e.id === id);
    
    if (entity) {
      cache.set(cacheKey, entity, 5 * 60 * 1000);
    }
    
    return entity || null;
  }

  protected async insertRow(data: Partial<T>): Promise<T> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = this.getSheetName();

    const entity = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      version: 1,
      ...data,
    } as T;

    const headers = await this.getHeaders();
    const row = headers.map(header => {
      const value = (entity as any)[header];
      return value !== undefined ? String(value) : '';
    });

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [row],
        },
      });

      // Invalidate cache
      cache.invalidatePattern(`${this.entityName}:`);
      cache.delete(`${this.entityName}:all`);

      return entity;
    } catch (error) {
      console.error(`Error inserting row for ${this.entityName}:`, error);
      throw new Error(`Failed to create ${this.entityName}`);
    }
  }

  protected async updateRowById(id: string, data: Partial<T>, expectedVersion: number): Promise<T> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = this.getSheetName();

    // Get current entity
    const currentEntity = await this.getRowById(id);
    if (!currentEntity) {
      throw new Error(`${this.entityName} not found`);
    }

    // Check version
    if ((currentEntity as any).version !== expectedVersion) {
      throw new Error('Version conflict - entity was modified by another user');
    }

    const updatedEntity = {
      ...currentEntity,
      ...data,
      updated_at: now(),
      version: expectedVersion + 1,
    } as T;

    // Find row index
    const allRows = await this.getAllRows();
    const rowIndex = allRows.findIndex((e: any) => e.id === id);
    if (rowIndex === -1) {
      throw new Error(`${this.entityName} not found`);
    }

    const headers = await this.getHeaders();
    const row = headers.map(header => {
      const value = (updatedEntity as any)[header];
      return value !== undefined ? String(value) : '';
    });

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowIndex + 2}:Z${rowIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [row],
        },
      });

      // Invalidate cache
      cache.invalidatePattern(`${this.entityName}:`);
      cache.delete(`${this.entityName}:all`);

      return updatedEntity;
    } catch (error) {
      console.error(`Error updating row for ${this.entityName}:`, error);
      throw new Error(`Failed to update ${this.entityName}`);
    }
  }

  protected async deleteRowById(id: string): Promise<void> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const sheetName = this.getSheetName();

    // Find row index
    const allRows = await this.getAllRows();
    const rowIndex = allRows.findIndex((e: any) => e.id === id);
    if (rowIndex === -1) {
      throw new Error(`${this.entityName} not found`);
    }

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming first sheet
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // +1 because sheets are 1-indexed
                endIndex: rowIndex + 2,
              },
            },
          }],
        },
      });

      // Invalidate cache
      cache.invalidatePattern(`${this.entityName}:`);
      cache.delete(`${this.entityName}:all`);
    } catch (error) {
      console.error(`Error deleting row for ${this.entityName}:`, error);
      throw new Error(`Failed to delete ${this.entityName}`);
    }
  }
}
