import { default as React } from 'react';


const DEFAULT_INITIAL_DATA = () => {
    return {
        events: [
            {
                "time": "Time",
                "description": "Description"
            }
        ],
    }
}

const ComponentsWrapper = (props) => {
    const [content, setContent] = React.useState('');
    const [edit, setEdit] = React.useState(true);

    const updateTimelineData = (newData) => {
        setTimelineData(newData);
        // if (props.onDataChange) {
        //   // Inform editorjs about data change
        //   props.onDataChange(newData);
        // }
    }

    const onAddEvent = (e) => {
        const newData = {
            ...timelineData
        }
        newData.events.push({
            "time": "Time",
            "description": "Description"
        })
        updateTimelineData(newData);
    }

    const onContentChange = (index, fieldName) => {
        return (e) => {
            const newData = {
                ...timelineData
            }
            newData.events[index][fieldName] = e.currentTarget.textContent;
            updateTimelineData(newData);
        }
    }

    return (
        <React.Fragment>
            <div className='p-2 border'>
                <p>Component In the works</p>
            </div>
        </React.Fragment>
    );
}

export default ComponentsWrapper;