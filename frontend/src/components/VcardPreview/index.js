import React, { useEffect } from 'react';
import toastError from "../../errors/toastError";
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';

import { Button, Divider, Typography} from "@material-ui/core";

const VcardPreview = ({ contact, numbers, numberInt }) => {
    const history = useHistory();
    useEffect(() => {}, [contact, numbers, numberInt]);

    const handleNewMessage = async() => {
        try {
            history.push(`/n/${numberInt}`)
        } catch (err) {
            toastError(err);
        }
    }

    return (
		<>
			<div style={{
				minWidth: "250px",
			}}>
				<div>
					{ contact && (
					<div style={{ display: "grid" }}>
                        <Typography style={{ marginTop: "12px", textAlign:"center" }} variant="subtitle1" color="primary" gutterBottom>
							<div><i class="fa-duotone fa-user-plus fa-beat" style={{fontSize: 24}} /></div>
						</Typography>
						<Typography style={{ marginBottom: "6px", textAlign:"center" }} variant="subtitle1" color="primary" gutterBottom>
							<div dangerouslySetInnerHTML={{ __html: contact.replace('\\n', '<br />') }}></div>
						</Typography>
                        <Typography style={{ marginBottom: "6px", textAlign:"center" }} variant="subtitle2" color="secondary" gutterBottom>
                            <div dangerouslySetInnerHTML={{ __html: numbers.replace('\\n', '<br />') }}></div>
						</Typography>
                        
					</div>
					)}
					<div style={{ display: "block", content: "", clear: "both" }}></div>
					<div>
						<Divider />
						<Button
							fullWidth
							color="primary"
							onClick={handleNewMessage}
							disabled={!numberInt}
						>Conversar</Button>
					</div>
				</div>
			</div>
		</>
	);
};

export default VcardPreview;