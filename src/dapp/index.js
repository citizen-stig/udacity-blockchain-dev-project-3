import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async () => {
    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            display('Operational Status', 'Check if contract is operational', [{
                label: 'Operational Status',
                error: error,
                value: result
            }]);
        });

        populateFlights(contract.flights);

        contract.addFlightStatusListener((error, result) => {
            display('Flight Status', 'Flight status recevied', [{
                label: 'Status',
                error: error,
                value: result.flight + ' ' + result.timestamp + ': ' + result.status_name,
            }]);

        });

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [{
                    label: 'Flight Status Request',
                    error: error,
                    value: result.flight + ' ' + result.timestamp
                }]);
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            let amount = DOM.elid('insurance-amount').value;
            console.log("User clicked 'Buy Insurance")
            // Write transaction
            contract.buyInsurance(flight, amount, (error, result) => {
                console.log("Bought insurances", result, error);
                display('Insurance', 'Bought insurance', [{
                    label: 'Insurance',
                    error: error,
                    value: 'Done'
                    // value: result.flight + ' ' + result.timestamp
                }]);
            });
        })

        DOM.elid('check-balance').addEventListener('click', () => {
            console.log("Checking balance");
            contract.checkBalance((error, result) => {
                console.log("Check Balance", result, error);
                display('Available balance', 'Available for withdraw', [{
                    label: 'Balance',
                    error: error,
                    value: result + ' ETH'
                }]);
            })
        });

        DOM.elid('withdraw-insurance').addEventListener('click', () => {
            contract.withdraw((error, result) => {
                console.log("Withdraw", result, error);
                display('Insurance withdrawal', 'Withdrawal funds', [{
                    label: 'Withdrawal',
                    error: error,
                    value: 'Done'
                }]);
            })

        })


    });
})();

function populateFlights(flights) {
    // let insuranceSelect = DOM.elid('insurance-flight')
    let flightStatusSelect = DOM.elid('flight-number');
    Object.keys(flights).forEach(flight => {
        // insuranceSelect.appendChild(DOM.makeElement('option', {value: flight}, flight));
        flightStatusSelect.appendChild(DOM.makeElement('option', {value: flight}, flight));

    });
}


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let timestamp = new Date();
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    section.appendChild(DOM.p(timestamp.toString()));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className: 'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}
