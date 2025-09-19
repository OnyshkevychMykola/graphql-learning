import JobList from '../components/JobList';
import {useJobs} from "../lib/graphql/hooks.js";
import {useState} from "react";
import PaginationBar from "../components/PaginationBar.jsx";

const JOBS_PER_PAGE = 5;

function HomePage() {
    const [currentPage, setCurrentPage] = useState(1);
    const {jobs, loading, error}
        = useJobs(JOBS_PER_PAGE, (currentPage - 1) * JOBS_PER_PAGE);
    const totalPages = Math.ceil(jobs?.totalCount / JOBS_PER_PAGE);
    return (
        <div>
            <h1 className="title">
                Job Board
            </h1>
            <PaginationBar currentPage={currentPage} totalPages={totalPages}
                           onPageChange={setCurrentPage}
            />
            <JobList jobs={jobs?.items}/>
        </div>
    );
}

export default HomePage;
