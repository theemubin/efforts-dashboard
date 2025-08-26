import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faTwitter,
	faVimeo,
	faFacebook,
} from "@fortawesome/free-brands-svg-icons";

const teamMembers = [
	{
		img: "https://cdn.easyfrontend.com/pictures/team/team_13_1.jpg",
		name: "KHAN SAHEB",
		designation: "HR, LATO",
		socialLinks: [
			{ icon: faTwitter, href: "#!" },
			{ icon: faFacebook, href: "#!" },
			{ icon: faVimeo, href: "#!" },
		],
	},
	{
		img: "https://cdn.easyfrontend.com/pictures/team/team_13_2.jpg",
		name: "Ali Akbar",
		designation: "HR, PIT",
		socialLinks: [
			{ icon: faTwitter, href: "#!" },
			{ icon: faFacebook, href: "#!" },
			{ icon: faVimeo, href: "#!" },
		],
	},
	{
		img: "https://cdn.easyfrontend.com/pictures/team/team_13_3.jpg",
		name: "Sadab Bean",
		designation: "HR, INCA",
		socialLinks: [
			{ icon: faTwitter, href: "#!" },
			{ icon: faFacebook, href: "#!" },
			{ icon: faVimeo, href: "#!" },
		],
	},
];

const TeamMemberItem = ({ member }: { member: typeof teamMembers[0] }) => (
	<div className="group relative">
		<img src={member.img} alt={member.name} className="h-auto w-full mx-auto" />
		<div className="absolute -bottom-12 left-[10%] p-5 w-[80%] bg-white shadow-xl dark:bg-slate-800 text-center overflow-hidden z-[1] group-hover:bg-blue-600 group-hover:pt-7 group-hover:px-5 group-hover:pb-20 duration-300 group-hover:text-white">
			<h3 className="text-xl font-semibold leading-normal opacity-80 mb-1">
				{member.name}
			</h3>
			<p className="text-[17px] leading-normal opacity-80 mb-2">
				{member.designation}
			</p>

			<div className="absolute w-full left-0 top-auto opacity-0 translate-y-7 group-hover:opacity-100 group-hover:translate-y-0 mt-1">
				<ul className="flex justify-center items-center">
					{member.socialLinks.map((item, i) => (
						<li key={i}>
							<a
								href={item.href}
								className="w-10 h-10 text-[26px] text-center hover:text-blue-600 mt-2 mr-2 opacity-90 p-0 relative z-[1] inline-flex justify-center items-center before:absolute before:w-full before:h-full before:opacity-0 before:translate-y-full before:bg-slate-800 before:-z-[1] hover:before:opacity-100 hover:before:translate-y-0 transition duration-300"
							>
								<FontAwesomeIcon icon={item.icon} />
							</a>
						</li>
					))}
				</ul>
			</div>
		</div>
	</div>
);

const TeamMember12: React.FC = () => {
	return (
		<section className="ezy__team12 light py-14 md:py-24 bg-white dark:bg-[#0b1727] text-zinc-900 dark:text-white overflow-hidden">
			<div className="container px-4 mx-auto">
				<div className="flex justify-center text-center">
					<div className="sm:max-w-md">
						<h3 className="text-3xl leading-none md:text-[45px] font-bold">
							Our Team
						</h3>
						<p className="text-[17px] leading-normal opacity-80 mt-4 mb-12">
							Lorem ipsum dolor sit amet consectetur adipiscing elit.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-6">
					{teamMembers.map((member, i) => (
						<div
							className="col-span-3 lg:col-span-1 my-12 lg:my-0 xl:p-12"
							key={i}
						>
							<TeamMemberItem member={member} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default TeamMember12;
