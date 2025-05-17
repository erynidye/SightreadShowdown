import React from 'react'; 
import { useState } from 'react';

export function ReadyButton() {
    const [isReady, setIsReady] = useState(false)

    return(
        <>
            <button onClick={() => setIsReady(!isReady)}>
                {isReady ? "I'm Ready!" : "Not Ready"}
            </button>
            {isReady && <p>Great! Let's get started.</p>}
        </>
    )

}