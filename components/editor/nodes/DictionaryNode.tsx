import { DecoratorNode } from "lexical";

export interface Dictionary {
  [Key: string]: string;
}

export class DictionaryNode extends DecoratorNode<JSX.Element> {
    __dictionaryData: Dictionary;
    static getType() {
      return 'dictionary';
    }
  
    decorate() {
      return (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          {Object.entries(this.__dictionaryData).map(([keyword, definition]) => (
            <tr key={keyword}>
              <td style={{ border: '1px solid black', padding: '8px' }}>{keyword}</td>
              <td style={{ border: '1px solid black', padding: '8px' }}>{definition}</td>
            </tr>
          ))}
        </table>
      );
    }

    createDOM() {
      const dom = document.createElement('table');
      dom.style.borderCollapse = 'collapse';
      dom.style.width = '100%';
  
      Object.entries(this.__dictionaryData).forEach(([keyword, definition]) => {
        const row = document.createElement('tr');
  
        const keywordCell = document.createElement('td');
        keywordCell.style.border = '1px solid black';
        keywordCell.style.padding = '8px';
        keywordCell.textContent = keyword;
        row.appendChild(keywordCell);
  
        const definitionCell = document.createElement('td');
        definitionCell.style.border = '1px solid black';
        definitionCell.style.padding = '8px';
        definitionCell.textContent = definition;
        row.appendChild(definitionCell);
  
        dom.appendChild(row);
      });
  
      return dom;
    }
  
    updateDOM() {
      return false; // DOM does not need updates
    }
  
    constructor(dictionaryData: Dictionary) {
      super();
      this.__dictionaryData = dictionaryData;
    }
  
    exportJSON() {
      return {
        type: 'dictionary',
        version: 1,
        dictionaryData: this.__dictionaryData,
      };
    }
  }