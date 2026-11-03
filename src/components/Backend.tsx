import { config } from "../config";
import { useCreateContext } from "../context/Create";
import { useGlobalContext } from "../context/Global";
import { defaultBackend, isBackendEnabled } from "../utils/helper";

const Backend = () => {
    const { backendSelect, setBackendSelect } = useCreateContext();
    const { backend, setBackend } = useGlobalContext();

    const openSelect = () => {
        setBackendSelect(!backendSelect());
    };

    // protection from bad persisted value
    if (!isBackendEnabled(backend())) {
        setBackend(defaultBackend());
    }

    return (
        <div class="backend-wrap" onClick={openSelect}>
            <div class="backend-selection">
                <h2>{config.backends[backend()].alias}</h2>
                <span class="arrow-down" />
            </div>
        </div>
    );
};

export default Backend;
