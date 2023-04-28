import { DocumentUpload, CloudAdd, Code1 } from 'iconsax-react';
import ReactDOM from 'react-dom';
import { renderToString } from 'react-dom/server';

import Wrapper from './wrapper';

// Advanced components - Tool box setup
export default class AdvancedComponents {
    static get toolbox() {
        return {
            title: 'React Components',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M17 10h2c2 0 3-1 3-3V5c0-2-1-3-3-3h-2c-2 0-3 1-3 3v2c0 2 1 3 3 3ZM5 22h2c2 0 3-1 3-3v-2c0-2-1-3-3-3H5c-2 0-3 1-3 3v2c0 2 1 3 3 3ZM6 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM18 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#FF8A65" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
            data: {
                level: 3,
            },
        }
    }

    static get isReadOnlySupported() {
        return true;
    }

    constructor({ data, api, config, readOnly, block }) {
        this.data = {
            content: data.content || {},
        };
        this.settings = [
            {
                icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M6.89 9c.98.49 1.82 1.23 2.43 2.15.35.52.35 1.19 0 1.71-.61.91-1.45 1.65-2.43 2.14M13 15h4" stroke="#FF8A65" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 22h6c5 0 7-2 7-7V9c0-5-2-7-7-7H9C4 2 2 4 2 9v6c0 5 2 7 7 7Z" stroke="#FF8A65" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
                label: 'Edit Component'
            },
        ];
        this.CSS = {
            wrapper: 'walkthrough-timeline',
        };
        this.nodes = {
            holder: null,
        };
        this.api = api;
        this.readOnly = readOnly;
    }

    // Called when the component has been selected
    render() {
        const rootNode = document.createElement('div');
        rootNode.setAttribute('class', this.CSS.wrapper);
        this.nodes.holder = rootNode;

        const onDataChange = (data) => {
            this.data = {
                content: data.replace(/\s+/g, ' ').trim()
            };
        }

        ReactDOM.render(
            (<Wrapper onDataChange={onDataChange} readOnly={this.readOnly} data={this.data} />),
            rootNode
        );

        return this.nodes.holder;
    }

    // Called after the element has been rendered
    renderSettings() {
        // On activation of a component
        // We send back the editing string for 
        return this.settings;
    }

    // Called for converting the block into Output block (data) 
    save(blockContent) {
        return this.data;
    }

    // Called to validate the save block data before doing so
    validate(savedData) {
        return true;
    }
}