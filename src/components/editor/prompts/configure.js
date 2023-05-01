import { default as React } from 'react';
import { Tabs, Accordion, Card, Button, Modal } from "flowbite-react";
import { DocumentUpload, CloudAdd, CloudPlus, ExportCircle, Book1 } from 'iconsax-react';

import { AppStateContext } from '../../../context/state';

export default function ConfigurePagePrompt(props) {
    const AppState = React.useContext(AppStateContext);
    const [configuration, setConfiguration] = React.useState({});

    React.useEffect(() => {

    }, []);

    return (
        <React.Fragment>
            <Modal
                size="md"
                show={AppState.configure}
                onClose={() => { AppState.setConfigure(false); }}
            >
                <Modal.Header className='text-sm'>
                    Page Configuration
                </Modal.Header>
                <Modal.Body>
                    <div className="space-y-2">
                        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            Your page configuration is a combination of both required data properties and as well anything you can think of that
                            your site designer will use in designing the doc website.
                        </p>
                        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                            The required data types include, privacy=public/hidden, purpose=page/external_link, external_link=url, seo=object(title, image, slug)
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button size={"sm"} onClick={() => { }}>
                        Save
                    </Button>
                    <Button size={"sm"} color="gray" onClick={() => { }}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment >
    );
}